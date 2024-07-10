import { IsArray, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Rfc822Dto } from '~/accounts/messages/_dto/rfc822.dto'
import { ApiProperty } from '@nestjs/swagger'
import { EnvelopeContentDto } from '~/accounts/messages/_dto/envelope-content.dto'

export class ChildNodeDto {
  @IsString()
  @ApiProperty()
  public part: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChildNodeDto)
  @ApiProperty({ type: [ChildNodeDto] })
  public childNodes?: ChildNodeDto[]

  @IsString()
  @ApiProperty()
  public type: string

  @IsObject()
  @IsOptional()
  @ApiProperty({ type: Object })
  public parameters?: {
    [key: string]: string
  }

  @IsString()
  @IsOptional()
  @ApiProperty()
  public encoding?: string

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  public size?: number

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EnvelopeContentDto)
  @ApiProperty({ type: EnvelopeContentDto })
  public envelope?: EnvelopeContentDto

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  public lineCount?: number

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  public language: string[]

  @IsString()
  @IsOptional()
  @ApiProperty()
  public disposition?: string

  @IsObject()
  @IsOptional()
  @ApiProperty({ type: Object })
  public dispositionParameters?: {
    [key: string]: string
  }
}
