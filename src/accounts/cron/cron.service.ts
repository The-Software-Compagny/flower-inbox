import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectImapflow } from '@the-software-compagny/nestjs_module_imapflow'
import { FetchMessageObject, ImapFlow, MailboxLockObject } from 'imapflow'
import { LRUCache } from 'lru-cache'
import { readAccountsFile } from '~/accounts/accounts.setup'
import { HttpService } from '@nestjs/axios'
import { omit } from 'radash'
import { createHmac } from 'crypto'
import { AxiosError } from 'axios'
import FormData from 'form-data'
import { CronResponseInterface, CronRunOptions } from '~/accounts/cron/cron.interface'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { AccountsFileV1, AccountsMetadataV1 } from '~/accounts/_dto/account.dto'

export const MAX_WEBHOOK_ATTEMPTS = 3
export const MAX_WEBHOOK_TIMEOUT = 60_000
export const CRON_PROCESS_TYPE_SYNC = 'sync'
export const CRON_PROCESS_TYPE_ASYNC = 'async'
export const CRON_PATTERN = /^((((\d+,)+\d+|(\d+([\/\-#])\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/i
export const CRON_DEFAULT_SEQ = '1:*'

@Injectable()
export class CronService implements OnModuleInit {
  protected cache: LRUCache<string, AccountsFileV1>
  protected logger: Logger = new Logger(CronService.name)

  public constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectImapflow() protected imapflow: Map<string, () => Promise<ImapFlow>>,
    private readonly httpService: HttpService,
  ) {
    this.cache = new LRUCache({
      max: 100,
      maxSize: 1000,
      sizeCalculation: () => 1,
      ttl: 1000 * 60 * 5,
    })
    this.httpService.axiosRef.defaults.timeout = 5_000
    this.httpService.axiosRef.interceptors.request.use(async (config) => {
      // noinspection JSUnresolvedReference
      if (process.env.npm_package_name && process.env.npm_package_version) {
        // noinspection JSUnresolvedReference
        config.headers['User-Agent'] = `${process.env.npm_package_name.split('/').pop()}/${process.env.npm_package_version}`
        config.headers['X-Webhook-Attempt'] = parseInt(config.headers['X-Webhook-Attempt'] || 0, 10) + 1
      }
      return config
    })
    this.httpService.axiosRef.interceptors.response.use(
      (res) => res,
      (error) => {
        // console.log('error', error)
        if (error.cause?.code === 'ECONNABORTED' || error.cause?.code === 'ECONNREFUSED') {
          if (error?.config?.headers['X-Webhook-Attempt'] >= MAX_WEBHOOK_ATTEMPTS) {
            return Promise.reject(error)
          }
          return new Promise((resolve) => {
            this.logger.warn(`Webhook timeout: ${error.config.url}. Retrying...`)
            const timeout = setTimeout(() => {
              clearTimeout(timeout)
              resolve(this.httpService.axiosRef.request(error.config))
            }, MAX_WEBHOOK_TIMEOUT)
          })
        }
        return Promise.reject(error)
      },
    )
  }

  public async onModuleInit() {
    const data = await readAccountsFile(this.cache)
    for (const account of data.accounts) {
      for (const key in account.webhooks) {
        const webhook = account.webhooks[key]
        if (!webhook.enabled || !webhook.cron.enabled) continue
        if (CRON_PATTERN.test(webhook.cron.pattern) === false) {
          this.logger.warn(
            `Webhook cron pattern invalid: <${webhook.cron.pattern}> on account <${account.id}> with seq <${webhook.cron.seq || CRON_DEFAULT_SEQ}>`,
          )
          continue
        }
        const cronName = `${account.id}_wh${key}_${webhook.cron.pattern.replace(/ /g, '')}`
        try {
          this.schedulerRegistry.getCronJob(cronName)
          this.logger.warn(
            `Webhook cron already registered: <${cronName}> on account <${account.id}> with seq <${webhook.cron.seq || CRON_DEFAULT_SEQ}>`,
          )
        } catch (e) {
          const mailbox = 'INBOX'
          const cronJob = new CronJob(webhook.cron.pattern, async () => {
            this.logger.log(`Cron triggered: <${webhook.cron.pattern}> on account <${account.id}> with seq <${webhook.cron.seq || CRON_DEFAULT_SEQ}>`)
            await this.process(account, webhook.cron.seq || CRON_DEFAULT_SEQ, {
              mailbox,
              sync: false,
              delete: true,
            })
          })
          this.schedulerRegistry.addCronJob(cronName, cronJob)
          cronJob.start()
          this.logger.log(`Webhook cron registered: <${cronName}> on account <${account.id}> with seq <${webhook.cron.seq || CRON_DEFAULT_SEQ}>`)
        }
      }
    }
  }

  public async runAll(seq: string, options?: CronRunOptions) {
    const imported = {}
    const data = await readAccountsFile(this.cache)
    for (const account of data.accounts) {
      imported[account.id] = []
      this.logger.log(`Starting cron for account: ${account.id}`)
      imported[account.id] = await this.process(account, seq, options)
    }
    return imported
  }

  public async runAccount(account: string, seq: string, options?: CronRunOptions) {
    const data = await readAccountsFile(this.cache)
    const acc = data.accounts.find((a) => a.id === account)
    return this.process(acc, seq, options)
  }

  protected async process(account: AccountsMetadataV1, seq: string, options?: CronRunOptions) {
    const mailbox = options?.mailbox || 'INBOX'
    const data = []
    this.logger.log(`Connected to account: ${account.id}`)
    const flow = await this.imapflow.get(account.id)()
    let lock: MailboxLockObject
    try {
      lock = await flow.getMailboxLock(mailbox)
    } catch (e) {
      throw new NotFoundException(`Mailbox ${mailbox} not found`)
    }
    try {
      const messages = flow.fetch(
        {
          seq,
          deleted: false,
        },
        {
          source: true,
          uid: true,
        },
      )
      for await (const message of messages) {
        const msg = omit(message, ['source', 'modseq'])
        if (options?.sync !== true) {
          this.triggerWebhook(account, msg, message.source)
            .then((res) => this.processToDelete({ flow, res, account, message: msg, options }))
            .catch((e: Error) => this.logger.error(`Webhook error: ${e.message}`, e.stack))
          data.push({
            ...msg,
            state: CRON_PROCESS_TYPE_ASYNC,
            response: null,
            deleting: null,
          })
        } else {
          try {
            const response = await this.triggerWebhook(account, msg, message.source)
            const deleting = await this.processToDelete({ flow, res: response, account, message: msg, options })
            data.push({
              ...msg,
              state: CRON_PROCESS_TYPE_SYNC,
              response,
              deleting,
            })
          } catch (e) {
            this.logger.error(`Webhook error: ${e.message}`, e.stack)
          }
        }
      }
    } finally {
      lock.release()
    }
    return data
  }

  protected async processToDelete(context: {
    flow: ImapFlow
    res: CronResponseInterface[]
    account: AccountsMetadataV1
    message: Partial<FetchMessageObject>
    options?: CronRunOptions
  }): Promise<boolean> {
    if (context.options?.delete === false) {
      this.logger.warn(`Message deleting ignored: ${context.message.seq} on account ${context.account.id}`)
      return false
    }
    for (const r of context.res) {
      if (r.statusCode !== HttpStatus.CONFLICT && (r.statusCode < HttpStatus.OK || r.statusCode >= HttpStatus.AMBIGUOUS)) {
        this.logger.error(`Webhook error: ${r.statusCode} on account ${context.account.id}`)
        return false
      }
    }
    context.flow
      .messageDelete({
        seq: `${context.message.seq}`,
      }, { uid: true })
      .then((_res) => this.logger.log(`Message deleted: ${context.message.seq} on account ${context.account.id}`))
      .catch((_e: Error) => this.logger.error(`Message not deleted: ${context.message.seq} on account ${context.account.id}`))
    return true
  }

  public async triggerWebhook(account: AccountsMetadataV1, payload: Partial<FetchMessageObject>, source: Buffer): Promise<CronResponseInterface[]> {
    const triggered = []
    const formData = new FormData()
    formData.append('account', account.imap.auth.user)
    formData.append('file', source, `${payload.uid}.eml`)
    Object.keys(payload).forEach((key) => formData.append(key, payload[key]))
    for (const webhook of account.webhooks) {
      if (!webhook.enabled) continue
      const hmac = createHmac(webhook.alg, webhook.secret)
      const digest = hmac.update(formData.getBuffer().toString('utf8')).digest('hex')
      try {
        const data = await this.httpService.axiosRef.post(webhook.url, formData, {
          headers: {
            ...formData.getHeaders(),
            'X-Webhook-Signature': `${webhook.alg}=${digest}`,
          },
        })
        this.logger.log(`Webhook triggered: ${webhook.url} on account ${account.id} with status ${data.status}`)
        triggered.push(<CronResponseInterface>{
          statusCode: data.status,
          data: data.data,
        })
      } catch (e) {
        const err = e as AxiosError
        this.logger.error(
          `Webhook error: ${err.message} on account ${account.id} with status ${err.response?.status}`,
          JSON.stringify(err?.response?.data || err.stack, null, 2),
        )
        triggered.push(<CronResponseInterface>{
          statusCode: err.response?.status,
          data: err.response?.data,
        })
      }
    }
    return triggered
  }
}
