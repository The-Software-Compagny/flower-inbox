import { Module } from '@nestjs/common'
import { CronService } from '~/accounts/cron/cron.service'
import { CronController } from '~/accounts/cron/cron.controller'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [HttpModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
