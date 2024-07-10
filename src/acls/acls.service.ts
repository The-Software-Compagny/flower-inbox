import { Injectable } from '@nestjs/common'
import { LRUCache } from 'lru-cache'
import { readTokensFile, TokensFileV1 } from '~/tokens/tokens.setup'

@Injectable()
export class AclsService {
  protected cache: LRUCache<string, TokensFileV1>

  public constructor() {
    this.cache = new LRUCache({
      max: 100,
      maxSize: 1000,
      sizeCalculation: () => 1,
      ttl: 1000 * 60 * 5,
    })
  }

  public async getGrantsObject(): Promise<object> {
    const acls = {}
    const tokens = await readTokensFile(this.cache)

    for (const token of tokens.tokens) {
      acls[token.client_id] = {}
      for (const acl of token.acls) {
        if (typeof acls[token.client_id][acl.resource] === 'undefined') {
          acls[token.client_id][acl.resource] = {}
        }
        const actions = typeof acl.actions === 'string' ? [acl.actions] : acl.actions
        for (const action of actions) {
          acls[token.client_id][acl.resource][action] = acl.attributes
        }
      }
    }

    return acls
  }
}
