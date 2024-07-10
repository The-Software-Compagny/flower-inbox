import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { ImapFlow } from 'imapflow'
import { LRUCache } from 'lru-cache'
import { InjectImapflow } from '@the-software-compagny/nestjs_module_imapflow'
import { readAccountsFile, writeAccountsFile } from './accounts.setup'
import { PartialType } from '@nestjs/swagger'
import { MailerService } from '@nestjs-modules/mailer'
import { AccountSubmitDto } from '~/accounts/_dto/account-submit.dto'
import { AccountSubmitedDto } from '~/accounts/_dto/account-submited.dto'
// import os from 'os'
// import gateway from 'default-gateway'
import { AccountsFileV1, AccountsMetadataV1 } from '~/accounts/_dto/account.dto'

class InternalAccountMetadataV1 extends PartialType(AccountsMetadataV1) { }

@Injectable()
export class AccountsService {
  protected cache: LRUCache<string, AccountsFileV1>
  protected logger: Logger = new Logger(AccountsService.name)

  public constructor(
    protected readonly moduleRef: ModuleRef,
    @InjectImapflow() protected imapflow: Map<string, ImapFlow>,
    private readonly mailerService: MailerService,
  ) {
    this.cache = new LRUCache({
      max: 100,
      maxSize: 1000,
      sizeCalculation: () => 1,
      ttl: 1000 * 60 * 5,
    })
  }

  public async search(): Promise<InternalAccountMetadataV1[]> {
    const data = await readAccountsFile(this.cache)
    return data.accounts
  }

  public async create(data: InternalAccountMetadataV1): Promise<InternalAccountMetadataV1> {
    const accounts = await readAccountsFile(this.cache)
    const account = new AccountsMetadataV1()
    Object.assign(account, data)
    accounts.accounts.push(account)
    await writeAccountsFile(accounts, this.cache)
    return account
  }

  public async read(id: string): Promise<InternalAccountMetadataV1> {
    const data = await readAccountsFile(this.cache)
    const account = data.accounts.find((a) => a.id === id)
    if (!account) {
      throw new NotFoundException(`Account not found: ${id}`)
    }
    return account
  }

  public async update(id: string, data: InternalAccountMetadataV1): Promise<InternalAccountMetadataV1> {
    const accounts = await readAccountsFile(this.cache)
    const account = accounts.accounts.find((a) => a.id === id)
    if (!account) {
      throw new NotFoundException(`Account not found: ${id}`)
    }
    Object.assign(account, data)
    await writeAccountsFile(accounts, this.cache)
    return account
  }

  public async delete(id: string): Promise<InternalAccountMetadataV1> {
    const accounts = await readAccountsFile(this.cache)
    const account = accounts.accounts.find((a) => a.id === id)
    if (!account) {
      throw new NotFoundException(`Account not found: ${id}`)
    }
    accounts.accounts = accounts.accounts.filter((a) => a.id !== id)
    await writeAccountsFile(accounts, this.cache)
    return account
  }

  public async submit(id: string, body: AccountSubmitDto, files?: Express.Multer.File[]): Promise<AccountSubmitedDto> {
    const accounts = await readAccountsFile(this.cache)
    const account = accounts.accounts.find((a) => a.id === id)
    if (!account) throw new NotFoundException(`Account not found: ${id}`)
    if (!body.template && !body.text && !body.html) {
      throw new BadRequestException(`Template, text or html is required !`)
    }
    try {
      return await this.mailerService.sendMail({
        ...body,
        attachments: files.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
        })),
        from:
          account.smtp.from ||
          account.smtp?.auth?.user ||
          (await (async () => {
            return `localhost@localhost`
            // return `${os.hostname()}@${(await gateway.v4()).gateway}`
          })()),
        transporterName: id,
      })
    } catch (e) {
      if (!e.code) throw new BadRequestException(`Failed to post message with <${e.message}>`, e.stack)
      switch (e.code) {
        case 'EDNS':
          throw new BadGatewayException(`[${e.code}] SMTP server connexion failed with <${e.message}>`, e.stack)
        case 'ESOCKET':
          throw new ServiceUnavailableException(`[${e.code}] SMTP server connexion failed with <${e.message}>`, e.stack)
        default:
          throw new InternalServerErrorException(`[${e.code}] SMTP connection attempt internal server error with <${e.message}>`, e.stack)
      }
    }
  }
}
