import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger'
import { Response } from 'express'
import { readFileSync } from 'node:fs'
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes'

export default function swagger(app: NestExpressApplication): void {
  try {
    const config = app.get<ConfigService>(ConfigService)
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    const build = new DocumentBuilder()
      .setTitle(pkg.name)
      .setDescription(pkg.description)
      .setVersion(pkg.version)
      .build()

    const document = SwaggerModule.createDocument(app, build)
    const theme = new SwaggerTheme()

    SwaggerModule.setup(config.get<string>('swagger.path'), app, document, {
      explorer: true,
      swaggerOptions: {},
      customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK_MONOKAI),
      ...config.get<SwaggerCustomOptions>('swagger.options'),
    })
    app.getHttpAdapter().get(config.get<string>('swagger.api'), (_, res: Response) => res.json(document))
  } catch (error) {
    console.error(error)
    //TODO: Implement error handling
  }
}
