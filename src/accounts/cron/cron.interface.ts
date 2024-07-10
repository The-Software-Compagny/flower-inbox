export interface CronResponseInterface {
  statusCode: number

  data?: any
}

export interface CronRunOptions {
  mailbox?: string
  sync?: boolean
  delete?: boolean
}
