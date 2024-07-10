import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt'
import { Request } from 'express'
import { LRUCache } from 'lru-cache'
import { readTokensFile, TokensFileV1 } from '~/tokens/tokens.setup'
import { TokenPayloadInterface } from '~/_common/interfaces/token-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  protected cache: LRUCache<string, TokensFileV1>

  public constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    super({
      secretOrKey: config.get<string>('jwt.options.secret'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
    })
    this.cache = new LRUCache({
      max: 100,
      maxSize: 1000,
      sizeCalculation: () => 1,
      ttl: 1000 * 60 * 5,
    })
  }

  public async validate(_: Request, payload: TokenPayloadInterface, done: VerifiedCallback): Promise<void> {
    if (!payload?.client_id) return done(new UnauthorizedException(), false)
    const tokens = await readTokensFile(this.cache)
    const token = tokens.tokens.find((t) => t.client_id === payload.client_id)
    if (!token) return done(new UnauthorizedException(), false)
    return done(null, payload)
  }
}
