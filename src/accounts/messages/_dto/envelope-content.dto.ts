import { IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Rfc822Dto } from '~/accounts/messages/_dto/rfc822.dto'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class EnvelopeContentDto {
  @IsDateString()
  @ApiProperty()
  public date: string

  @IsString()
  @ApiProperty()
  public subject: string

  @ValidateNested({ each: true })
  @Type(() => Rfc822Dto)
  @ApiProperty({ type: [Rfc822Dto] })
  public from: Rfc822Dto[]

  @ValidateNested({ each: true })
  @Type(() => Rfc822Dto)
  @ApiProperty({ type: [Rfc822Dto] })
  public sender: Rfc822Dto[]

  @ValidateNested({ each: true })
  @Type(() => Rfc822Dto)
  @ApiProperty({ type: [Rfc822Dto] })
  public replyTo: Rfc822Dto[]

  @ValidateNested({ each: true })
  @Type(() => Rfc822Dto)
  @ApiProperty({ type: [Rfc822Dto] })
  public to: Rfc822Dto[]

  @IsString()
  @IsOptional()
  @ApiProperty()
  public inReplyTo?: string

  @IsString()
  @ApiProperty()
  public messageId: string
}
