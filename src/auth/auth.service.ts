import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(this.constructor.name)

  public constructor(protected jwtService: JwtService) {
  }
}
