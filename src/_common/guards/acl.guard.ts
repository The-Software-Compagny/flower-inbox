import { ACGuard, RolesBuilder } from 'nest-access-control'
import { Reflector } from '@nestjs/core'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { TokenPayloadInterface } from '~/_common/interfaces/token-payload.interface'

export class AclGuard extends ACGuard {
  protected ac: RolesBuilder

  constructor(reflector: Reflector, roleBuilder: RolesBuilder) {
    super(reflector, roleBuilder)
    this.ac = roleBuilder
  }

  protected async getUserRoles(context: ExecutionContext): Promise<string | string[]> {
    const user = (await this.getUser(context)) as TokenPayloadInterface
    if (!user) throw new UnauthorizedException()
    return user.client_id
  }
}
