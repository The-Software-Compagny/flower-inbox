import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from '~/auth/jwt.strategy'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from '~/auth/auth.service'
import { AuthController } from '~/auth/auth.controller'

@Module({
  imports: [
    PassportModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...configService.get<object>('passport.options', {}),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...configService.get<object>('jwt.options', {}),
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [PassportModule, JwtModule],
})
export class AuthModule { }
