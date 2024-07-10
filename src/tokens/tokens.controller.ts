import { Body, Controller, Delete, HttpStatus, Param, Post, Res } from '@nestjs/common'
import { TokensService } from './tokens.service'
import { ModuleRef } from '@nestjs/core'
import { Response } from 'express'
import { TokensMetadataV1 } from '~/tokens/tokens.setup'
import { ApiTags, PartialType } from '@nestjs/swagger'
import { UseRoles } from 'nest-access-control'
import { ScopesEnum } from '~/_common/enums/scopes.enum'
import { ActionEnum } from '~/_common/enums/action.enum'
import { ApiCreateDecorator } from '~/_common/decorators/api-create.decorator'
import { ApiDeletedResponseDecorator } from '~/_common/decorators/api-deleted-response.decorator'

class InternalTokensMetadataV1 extends PartialType(TokensMetadataV1) { }

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  public constructor(protected readonly service: TokensService) {
  }

  @Post()
  @UseRoles({
    resource: ScopesEnum.Tokens,
    action: ActionEnum.Read,
  })
  @ApiCreateDecorator(InternalTokensMetadataV1, InternalTokensMetadataV1)
  public async create(@Res() res: Response, @Body() body: InternalTokensMetadataV1): Promise<Response> {
    const data = await this.service.create(body)
    return res.json({
      statusCode: HttpStatus.CREATED,
      data,
    })
  }

  @Delete(':token([\\w-.]+)')
  @UseRoles({
    resource: ScopesEnum.Tokens,
    action: ActionEnum.Delete,
  })
  @ApiDeletedResponseDecorator(InternalTokensMetadataV1)
  public async delete(@Res() res: Response, @Param('token') token: string): Promise<Response> {
    const data = await this.service.delete(token)
    return res.json({
      statusCode: HttpStatus.OK,
      data,
    })
  }
}
