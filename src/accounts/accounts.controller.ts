import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Res,
  Sse,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { Response } from 'express'
import { FSWatcher, watch } from 'fs'
import { Observable } from 'rxjs'
import { AccountsService } from './accounts.service'
import { UseRoles } from 'nest-access-control'
import { ScopesEnum } from '~/_common/enums/scopes.enum'
import { ActionEnum } from '~/_common/enums/action.enum'
import { ApiCreateDecorator } from '~/_common/decorators/api-create.decorator'
import { ApiSimpleSearchDecorator } from '~/_common/decorators/api-simple-search.decorator'
import { ApiReadResponseDecorator } from '~/_common/decorators/api-read-response.decorator'
import { ApiUpdateDecorator } from '~/_common/decorators/api-update.decorator'
import { ApiDeletedResponseDecorator } from '~/_common/decorators/api-deleted-response.decorator'
import { ApiTags } from '@nestjs/swagger'
import { FilesInterceptor } from '@nestjs/platform-express'
import { AccountSubmitDto } from '~/accounts/_dto/account-submit.dto'
import { AccountSubmitedDto } from '~/accounts/_dto/account-submited.dto'
import { AccountsMetadataV1 } from '~/accounts/_dto/account.dto'
import { ACCOUNTS_FILE_PATH, readAccountsFile } from './accounts.setup'

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  public constructor(protected readonly service: AccountsService) {
  }

  @Get()
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Read,
  })
  @ApiSimpleSearchDecorator(AccountsMetadataV1)
  public async search(@Res() res: Response): Promise<Response> {
    const data = await this.service.search()
    return res.json({
      statusCode: HttpStatus.OK,
      data,
    })
  }

  @Post()
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Create,
  })
  @ApiCreateDecorator(AccountsMetadataV1, AccountsMetadataV1)
  public async create(@Res() res: Response, @Body() body: AccountsMetadataV1): Promise<Response> {
    const data = await this.service.create(body)
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      data,
    })
  }

  @Get(':account([\\w-.]+)')
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Read,
  })
  @ApiReadResponseDecorator(AccountsMetadataV1)
  public async read(@Res() res: Response, @Param('account') id: string): Promise<Response> {
    const data = await this.service.read(id)
    return res.json({
      statusCode: HttpStatus.OK,
      data,
    })
  }

  @Patch(':account([\\w-.]+)')
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Update,
  })
  @ApiUpdateDecorator(AccountsMetadataV1, AccountsMetadataV1)
  public async update(@Res() res: Response, @Param('account') id: string, @Body() body: AccountsMetadataV1): Promise<Response> {
    const data = await this.service.update(id, body)
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data,
    })
  }

  @Delete(':account([\\w-.]+)')
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Delete,
  })
  @ApiDeletedResponseDecorator(AccountsMetadataV1)
  public async delete(@Res() res: Response, @Param('account') id: string): Promise<Response> {
    const data = await this.service.delete(id)
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data,
    })
  }

  @Post(':account([\\w-.]+)/submit')
  @UseInterceptors(FilesInterceptor('files'))
  @UseRoles({
    resource: ScopesEnum.Accounts,
    action: ActionEnum.Create,
  })
  @ApiDeletedResponseDecorator(AccountSubmitedDto)
  public async submit(
    @Res() res: Response,
    @Param('account') id: string,
    @Body() body: AccountSubmitDto,
    @UploadedFiles(new ParseFilePipe({ fileIsRequired: false })) files: Array<Express.Multer.File> = [],
  ): Promise<Response> {
    const data = await this.service.submit(id, body, files)
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data,
    })
  }

  @Sse('changes')
  public async sse(@Res() res: Response): Promise<Observable<MessageEvent>> {
    let subscriber: FSWatcher
    res.socket.on('close', () => {
      if (subscriber) {
        subscriber.close()
        Logger.debug(`Observer close connection from SSE<changes>`, this.constructor.name)
      }
    })
    return new Observable((observer) => {
      subscriber = watch(ACCOUNTS_FILE_PATH, async () => {
        const data = await readAccountsFile()
        observer.next({ data } as MessageEvent)
      })
    })
  }
}
