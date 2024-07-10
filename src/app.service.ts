import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { readFileSync } from 'fs'
import { pick } from 'lodash'
import os from 'node:os'
import { PackageJson } from 'types-package-json'
import v8 from 'node:v8'

@Injectable()
export class AppService {
  protected package: Partial<PackageJson>

  public constructor(
    protected readonly moduleRef: ModuleRef,
    protected readonly config: ConfigService,
  ) {
    try {
    this.package = JSON.parse(readFileSync('package.json', 'utf-8'))
    } catch (error) {
      //TODO: Implement error handling
    }
  }

  public getInfo(): Partial<PackageJson> {
    return pick(this.package, ['name', 'version'])
  }

  public getDevInfos() {
    return {
      swagger: {
        path: this.config.get<string>('swagger.path'),
        api: this.config.get<string>('swagger.api'),
      },
      metrics: {
        loadavg: os.loadavg(),
        uptime: os.uptime(),
        heapStatistics: v8.getHeapStatistics(),
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        networkInterfaces: os.networkInterfaces(),
        cpus: os.cpus(),
      },
    }
  }
}
