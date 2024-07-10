import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common'
import { MailboxesService } from './mailboxes.service'
import { ApiTags } from '@nestjs/swagger'
import { ModuleRef } from '@nestjs/core'
import { Response } from 'express'
import { UseRoles } from 'nest-access-control'
import { ScopesEnum } from '~/_common/enums/scopes.enum'
import { ActionEnum } from '~/_common/enums/action.enum'
import { ApiSimpleSearchDecorator } from '~/_common/decorators/api-simple-search.decorator'
import { ListTreeDto } from '~/accounts/mailboxes/_dto/list-tree.dto'

@ApiTags('mailboxes')
@Controller(':account([\\w-.]+)/mailboxes')
export class MailboxesController {
  public constructor(protected readonly service: MailboxesService) {
  }

  @Get()
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Read,
  })
  @ApiSimpleSearchDecorator(ListTreeDto)
  public async search(@Res() res: Response, @Param('account') account: string): Promise<any> {
    const data = await this.service.search(account)
    return res.json({
      statusCode: HttpStatus.OK,
      data,
    })
  }

  //TODO: add other methods
}
