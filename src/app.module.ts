import { Module } from "@nestjs/common"
import configInstance from '~/config'
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { APP_GUARD, APP_PIPE } from "@nestjs/core"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { DtoValidationPipe } from "@the-software-compagny/nestjs_module_restools"
import { ImapflowModule } from "@the-software-compagny/nestjs_module_imapflow"
import { AccountsMetadataV1 } from "./accounts/_dto/account.dto"
import { MailerModule, MailerOptions } from "@nestjs-modules/mailer"
import { AccountsModule } from "./accounts/accounts.module"
import { CronModule } from "./accounts/cron/cron.module"
import { ScheduleModule } from "@nestjs/schedule"
import { AccessControlModule, RolesBuilder } from "nest-access-control"
import { AclsModule } from "./acls/acls.module"
import { AclsService } from "./acls/acls.service"
import { AuthGuard } from "./_common/guards/auth.guard"
import { AclGuard } from "./_common/guards/acl.guard"
import { AuthModule } from "./auth/auth.module"
import { TokensModule } from "./tokens/tokens.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configInstance],
    }),
    // RedisModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => ({
    //     config: {
    //       url: configService.get<string>('ioredis.uri'),
    //       ...configService.get<RedisOptions>('ioredis.options'),
    //     },
    //   }),
    // }),
    ImapflowModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        config: config.get<AccountsMetadataV1[]>('mailer.accounts'),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        ...config.get<MailerOptions>('mailer.options'),
      }),
    }),
    AccessControlModule.forRootAsync({
      imports: [AclsModule],
      inject: [AclsService],
      useFactory: async (aclService: AclsService) => {
        return new RolesBuilder(await aclService.getGrantsObject())
      },
    }),
    ScheduleModule.forRoot(),
    AccountsModule.register(),
    CronModule,
    AuthModule,
    TokensModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AclGuard,
    },
    {
      provide: APP_PIPE,
      useClass: DtoValidationPipe,
    },
  ],
})
export class AppModule { }
