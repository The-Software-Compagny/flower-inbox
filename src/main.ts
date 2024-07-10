import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Response } from 'express'
import { json } from 'body-parser'
import passport from 'passport'
import configInstance from './config'
import 'multer'
import { join } from 'node:path'

declare const module: any
(async (): Promise<void> => {
  const config = await configInstance()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: config.application.logger,
  })

  app.use((_, res: Response, next: () => void) => {
    res.removeHeader('x-powered-by')
    next()
  })

  app.use(passport.initialize())
  app.use(json({ limit: '50mb' }))
  app.useStaticAssets(join(__dirname, 'public'))
  app.setBaseViewsDir(join(__dirname, 'templates'))

  if (process.env.production !== 'production') {
    (await import('./swagger')).default(app)
  }

  await app.listen(7000, () => {
    console.log('Server is running on http://localhost:7000')
  })

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose((): Promise<void> => app.close())
  }
})()
