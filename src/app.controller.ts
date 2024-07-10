import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common'
import { Response } from 'express'
import { AppService } from './app.service'
import { Public } from '@the-software-compagny/nestjs_module_restools'

@Public()
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  public constructor(private readonly service: AppService) {}

  @Get()
  public getInfo(@Res() res: Response): Response {
    let devInfos = {}
    if (process.env.NODE_ENV !== 'production') {
      devInfos = {
        ...devInfos,
        ...this.service.getDevInfos(),
      }
    }
    return res.json({
      ...this.service.getInfo(),
      devInfos,
    })
  }
}
