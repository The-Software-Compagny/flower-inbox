import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator'

export class AccountSubmitedDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  public accepted?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  public rejected?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  public ehlo?: string[]

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  public envelopeTime?: number

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  public messageTime?: number

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  public messageSize?: number

  @IsOptional()
  @IsString()
  @ApiProperty()
  public response?: string

  @IsOptional()
  @IsObject()
  @ApiProperty()
  public envelope?: {
    [name: string]: any
  }

  @IsOptional()
  @IsString()
  @ApiProperty()
  public messageId?: string
}
