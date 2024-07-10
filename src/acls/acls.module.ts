import { Module } from '@nestjs/common'
import { AclsService } from '~/acls/acls.service'

@Module({
  providers: [AclsService],
  exports: [AclsService],
})
export class AclsModule { }
