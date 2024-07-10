import { Logger } from '@nestjs/common'
import { instanceToInstance, plainToInstance } from 'class-transformer'
import { validateOrReject } from 'class-validator'
import { existsSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'fs/promises'
import { LRUCache } from 'lru-cache'
import { resolve } from 'node:path'
import { parse, stringify } from 'yaml'
import { AccountsFileV1, AccountsMetadataV1 } from '~/accounts/_dto/account.dto'

export const ACCOUNTS_FILE_PATH = resolve('./config/accounts.yml')

export default async function setupAccounts(): Promise<AccountsMetadataV1[]> {
  try {
    if (existsSync(ACCOUNTS_FILE_PATH)) {
      Logger.verbose('Account file found, validating...', 'setupAccounts')
      return await validateAccounts()
    }
  } catch (err) {
    Logger.error(err)
    process.exit(1)
  }
}

export async function validateAccounts(): Promise<AccountsMetadataV1[]> {
  const data = readFileSync(ACCOUNTS_FILE_PATH, 'utf8')
  const yml = parse(data)
  const schema = plainToInstance(AccountsFileV1, yml)

  try {
    await validateOrReject(schema, {
      whitelist: true,
    })
  } catch (errors) {
    const err = new Error(`Invalid accounts`)
    err.message = errors.map((e) => e.toString()).join(', ') //TODO: improve error message
    throw err
  }

  return yml.accounts
}

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export async function writeAccountsFile(data: AccountsFileV1, cache?: LRUCache<string, AccountsFileV1>): Promise<void> {
  const schema = instanceToInstance(data)
  try {
    await validateOrReject(schema, {
      whitelist: true,
    })
    const yml = stringify(schema)
    await writeFile(ACCOUNTS_FILE_PATH, yml)
    if (cache) {
      Logger.debug(`writeAccountsFile: ${ACCOUNTS_FILE_PATH} to cache`, 'setup/writeAccountsFile')
      cache.set(ACCOUNTS_FILE_PATH, schema)
    }
  } catch (errors) {
    console.log('errors', errors)
    const err: Error & any = new Error(`Invalid accounts`)
    err.message = errors.map((e) => e.toString()).join(', ') //TODO: improve error message
    err.errors = errors.map((e) => e.toString()) //TODO: improve error message
    throw err
  }
}

export async function readAccountsFile(cache?: LRUCache<string, AccountsFileV1>): Promise<AccountsFileV1> {
  if (cache && cache.has(ACCOUNTS_FILE_PATH)) {
    Logger.debug(`readAccountsFile: ${ACCOUNTS_FILE_PATH} from cache`, 'setup/readAccountsFile')
    return cache.get(ACCOUNTS_FILE_PATH)
  }
  const data = await readFile(ACCOUNTS_FILE_PATH, 'utf8')
  const yml = parse(data)

  const schema = plainToInstance(AccountsFileV1, yml)
  if (cache && !cache.has(ACCOUNTS_FILE_PATH)) {
    Logger.debug(`readAccountsFile: ${ACCOUNTS_FILE_PATH} to cache`, 'setup/readAccountsFile')
    cache.set(ACCOUNTS_FILE_PATH, schema)
  }
  return schema
}
