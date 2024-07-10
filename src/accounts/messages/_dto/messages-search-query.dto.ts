import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class MessagesSearchQueryDto {
  @IsString()
  @IsOptional()
  public mailbox?: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public limit?: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public skip?: number
}
