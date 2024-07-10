import { NestApplicationOptions, LogLevel } from "@nestjs/common"
import { BinaryLike, CipherCCMTypes, CipherGCMTypes, CipherKey, createHash } from "node:crypto"
import { HelmetOptions } from "helmet"
import { IAuthModuleOptions } from '@nestjs/passport'
import { MailerOptions } from '@nestjs-modules/mailer'
// import { RedisOptions } from "ioredis"
import { SwaggerCustomOptions } from "@nestjs/swagger"
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { AccountsMetadataV1 } from "./accounts/_dto/account.dto"
import setupAccounts from "./accounts/accounts.setup"
import setupTokens, { TokensMetadataV1 } from "./tokens/tokens.setup"
import { JwtModuleOptions } from "@nestjs/jwt"
import { join } from "node:path"

export interface ConfigInstance {
  application: NestApplicationOptions
  helmet: HelmetOptions
  // ioredis: {
  //   uri: string
  //   options: RedisOptions
  // }
  mailer: {
    accounts: AccountsMetadataV1[]
    options?: MailerOptions
  }
  crypt: {
    algorithm: string | CipherCCMTypes | CipherGCMTypes
    securityKey: CipherKey
    initVector: BinaryLike
  }
  jwt: {
    options: JwtModuleOptions
  }
  passport: {
    options: IAuthModuleOptions
    modules?: {
      [key: string]: any
    }
  }
  swagger: {
    path?: string
    api?: string
    options?: SwaggerCustomOptions
  }
  tokens: TokensMetadataV1[]
}

export default async (): Promise<ConfigInstance> => {
  const mailerAccounts = await setupAccounts()
  const tokens = await setupTokens()

  console.log('ok', mailerAccounts.reduce((acc, account) => {
    if (account.smtp) {
      acc[account.id] = account.smtp
    }
    return acc
  }, {}))
  return {
    application: {
      logger: process.env['FLOWERINBOX_LOGGER']
        ? (process.env['FLOWERINBOX_LOGGER'].split(',') as LogLevel[])
        : process.env['NODE_ENV'] === 'development'
          ? ['error', 'warn', 'log', 'debug']
          : ['error', 'warn', 'log'],
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          objectSrc: ["'self'"],
          frameSrc: ["'self'"],
          styleSrc: ["'self'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'"],
          scriptSrc: ["'self'"],
        },
      },
    },
    // ioredis: {
    //   uri: process.env['FLOWERINBOX_IOREDIS_URL'],
    //   options: {
    //     showFriendlyErrorStack: true,
    //   },
    // },
    mailer: {
      accounts: mailerAccounts,
      options: {
        transports: mailerAccounts.reduce((acc, account) => {
          if (account.smtp) {
            acc[account.id] = account.smtp
          }
          return acc
        }, {}),
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
        template: {
          dir: join(__dirname, '/../templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      },
    },
    jwt: {
      options: {
        secret: process.env['FLOWERINBOX_JWT_SECRET'],
      },
    },
    crypt: {
      algorithm: 'aes-256-cbc',
      securityKey: process.env['FLOWERINBOX_CRYPT_SECURITYKEY']
        ? createHash('sha256').update(String(process.env['FLOWERINBOX_CRYPT_SECURITYKEY'])).digest('base64').substring(0, 32)
        : null,
      initVector: createHash('md5').update(String(process.env['FLOWERINBOX_CRYPT_SECURITYKEY'])).digest('hex').substring(0, 16),
    },
    passport: {
      options: {
        defaultStrategy: 'jwt',
        property: 'user',
        session: false,
      },
      modules: {},
    },
    tokens,
    swagger: {
      path: '/swagger',
      api: '/swagger/json',
      options: {
        swaggerOptions: {
          persistAuthorization: true,
        },
      },
    },
  }
}
