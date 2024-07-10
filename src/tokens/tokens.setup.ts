import { Logger } from '@nestjs/common'
import { instanceToInstance, plainToInstance, Type } from 'class-transformer'
import { IsArray, IsEnum, IsIP, IsNotEmpty, IsOptional, IsString, MinLength, Validate, ValidateNested, validateOrReject } from 'class-validator'
import { existsSync, readFileSync } from 'node:fs'
import { readFile, writeFile } from 'fs/promises'
import { LRUCache } from 'lru-cache'
import { parse, stringify } from 'yaml'
import { UniqueFieldValidator } from '~/_common/validators/unique.field.validator'
import { IsType } from '~/_common/decorators/is-type.decorator'
import { ApiProperty } from '@nestjs/swagger'
import { resolve } from 'node:path'

export const TOKENS_FILE_PATH = resolve('./config/tokens.yml')

export class TokensFileV1 {
  @IsEnum(['1'])
  public version: string

  @ValidateNested({ each: true })
  @Validate(UniqueFieldValidator, ['client_id'])
  @Type(() => TokensMetadataV1)
  public tokens: TokensMetadataV1[]
}

export class TokensMetadataAclsV1 {
  @IsString()
  @ApiProperty()
  public resource: string

  @IsType(['string', 'object'])
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'object' }] })
  public actions: string | string[]

  @IsArray()
  public attributes: string[]
}

export class TokensMetadataV1 {
  [key: string]: unknown

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  public client_id: string

  @IsString()
  @IsNotEmpty()
  @MinLength(16)
  @ApiProperty()
  public key: string

  @IsArray()
  @IsOptional()
  @IsIP(null, { each: true })
  @ApiProperty({ type: [String] })
  public ip: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokensMetadataAclsV1)
  @ApiProperty({ type: [TokensMetadataAclsV1] })
  public acls: TokensMetadataAclsV1[]
}

export default async function setupTokens(): Promise<TokensMetadataV1[]> {
  try {
    if (existsSync(TOKENS_FILE_PATH)) {
      Logger.verbose('Token file found, validating...', 'setupTokens')
      return await validateTokens()
    }
  } catch (err) {
    Logger.error(err)
    process.exit(1)
  }
}

export async function validateTokens(): Promise<TokensMetadataV1[]> {
  const data = readFileSync(TOKENS_FILE_PATH, 'utf8')
  const yml = parse(data)
  const schema = plainToInstance(TokensFileV1, yml)

  try {
    await validateOrReject(schema, {
      whitelist: true,
    })
  } catch (errors) {
    const err = new Error(`Invalid tokens`)
    console.log('errors', errors)
    err.message = errors.map((e: Error) => e.toString()).join(', ') //TODO: improve error message
    throw err
  }

  return yml.tokens
}

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export async function writeTokensFile(data: TokensFileV1, cache?: LRUCache<string, TokensFileV1>): Promise<void> {
  const schema = instanceToInstance(data)
  try {
    await validateOrReject(schema, {
      whitelist: true,
    })
    const yml = stringify(schema)
    await writeFile(TOKENS_FILE_PATH, yml)
    if (cache) {
      Logger.debug(`writeTokensFile: ${TOKENS_FILE_PATH} to cache`, 'setup/writeTokensFile')
      cache.set(TOKENS_FILE_PATH, schema)
    }
  } catch (errors) {
    console.log('errors', errors)
    const err: Error & any = new Error(`Invalid tokens`)
    err.message = errors.map((e: Error) => e.toString()).join(', ') //TODO: improve error message
    err.errors = errors.map((e: Error) => e.toString()) //TODO: improve error message
    throw err
  }
}

export async function readTokensFile(cache?: LRUCache<string, TokensFileV1>): Promise<TokensFileV1> {
  if (cache && cache.has(TOKENS_FILE_PATH)) {
    Logger.debug(`readTokensFile: ${TOKENS_FILE_PATH} from cache`, 'setup/readTokensFile')
    return cache.get(TOKENS_FILE_PATH)
  }
  const data = await readFile(TOKENS_FILE_PATH, 'utf8')
  const yml = parse(data)
  const schema = plainToInstance(TokensFileV1, yml)
  if (cache && !cache.has(TOKENS_FILE_PATH)) {
    Logger.debug(`readTokensFile: ${TOKENS_FILE_PATH} to cache`, 'setup/readTokensFile')
    cache.set(TOKENS_FILE_PATH, schema)
  }
  return schema
}
