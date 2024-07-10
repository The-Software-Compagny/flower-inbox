import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { LRUCache } from 'lru-cache'
import { ModuleRef } from '@nestjs/core'
import { readTokensFile, TokensFileV1, TokensMetadataV1, writeTokensFile } from '~/tokens/tokens.setup'

@Injectable()
export class TokensService {
  protected cache: LRUCache<string, TokensFileV1>
  protected logger: Logger = new Logger(TokensService.name)

  public constructor() {
    this.cache = new LRUCache({
      max: 100,
      maxSize: 1000,
      sizeCalculation: () => 1,
      ttl: 1000 * 60 * 5,
    })
  }

  public async create(data: Partial<TokensMetadataV1>): Promise<Partial<TokensMetadataV1>> {
    const tokens = await readTokensFile(this.cache)
    const token = new TokensMetadataV1()
    Object.assign(token, data)
    tokens.tokens.push(token)
    await writeTokensFile(tokens, this.cache)
    return token
  }

  public async delete(key: string): Promise<Partial<TokensMetadataV1>> {
    const tokens = await readTokensFile(this.cache)
    const token = tokens.tokens.find((t) => t.key === key)
    if (!token) {
      throw new NotFoundException(`Token not found: ${key}`)
    }
    tokens.tokens = tokens.tokens.filter((a) => a.id !== key)
    await writeTokensFile(tokens, this.cache)
    return token
  }
}
