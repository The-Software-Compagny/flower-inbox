import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { TextEncoding } from 'nodemailer/lib/mailer'

export class AccountSubmitDto {
  @IsEmail({}, { each: true })
  @ApiProperty()
  public to: string[]

  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty()
  public cc?: string[]

  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty()
  public bcc?: string[]

  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty()
  public replyTo?: string[]

  @IsEmail()
  @IsOptional()
  @ApiProperty()
  public inReplyTo?: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  public subject?: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  public text?: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  public html?: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  public raw?: string

  @IsEnum({ quotedPrintable: 'quoted-printable', base64: 'base64' })
  @IsOptional()
  @ApiProperty({ enum: ['quoted-printable', 'base64'] })
  public textEncoding?: TextEncoding

  @IsDateString()
  @IsOptional()
  @ApiProperty()
  public date?: string

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  public references?: string[]

  @IsString()
  @IsOptional()
  @ApiProperty()
  public encoding?: string

  @IsObject()
  @IsOptional()
  @ApiProperty()
  public headers?: {
    [name: string]: any
  }

  @IsOptional()
  @IsObject()
  @ApiProperty()
  public context?: {
    [name: string]: any
  }

  @IsString()
  @IsOptional()
  @ApiProperty()
  public template?: string
}
