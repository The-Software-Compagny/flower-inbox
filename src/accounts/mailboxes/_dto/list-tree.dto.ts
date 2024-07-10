import { IsBoolean, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class ListTreeDto {
  @IsString()
  @ApiProperty()
  public name: string

  @IsObject()
  @IsOptional()
  @ApiProperty({ type: Object })
  public flags?: {
    [key: string]: string
  }

  @IsString()
  @ApiProperty()
  public path: string

  @IsBoolean()
  @ApiProperty()
  public subscribed: boolean

  @IsBoolean()
  @ApiProperty()
  public listed: boolean

  @IsString()
  @ApiProperty()
  public delimiter: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  public specialUse?: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ListTreeDto)
  @ApiProperty({ type: [ListTreeDto] })
  public folders?: ListTreeDto[]
}
