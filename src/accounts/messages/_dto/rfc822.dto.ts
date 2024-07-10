import { IsEmail, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class Rfc822Dto {
  @IsString()
  @ApiProperty()
  public name: string

  @IsEmail()
  @ApiProperty()
  public address: string
}
