import { Injectable, NotFoundException } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { InjectImapflow } from '@the-software-compagny/nestjs_module_imapflow'
import { ImapFlow, ListTreeResponse } from 'imapflow'

@Injectable()
export class MailboxesService {
  public constructor(@InjectImapflow() protected imapflow: Map<string, () => Promise<ImapFlow>>) {
  }

  public async search(account: string): Promise<ListTreeResponse[]> {
    if (!this.imapflow.has(account)) throw new NotFoundException(`Account ${account} not found`)
    const flow = await this.imapflow.get(account)()
    const tree = await flow.listTree()
    return tree.folders
  }

  //TODO: add other methods
}
