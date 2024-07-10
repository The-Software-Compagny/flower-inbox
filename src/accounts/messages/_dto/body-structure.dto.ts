import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { ChildNodeDto } from '~/accounts/messages/_dto/child-node.dto'

export class BodyStructureDto {
  @ValidateNested({ each: true })
  @Type(() => ChildNodeDto)
  @ApiProperty({ type: [ChildNodeDto] })
  public childNodes: ChildNodeDto[]

  @IsString()
  @ApiProperty()
  public type: string

  @IsObject()
  @ApiProperty({ type: Object })
  public parameters: {
    [key: string]: string
  }

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  public language: string[]
}
