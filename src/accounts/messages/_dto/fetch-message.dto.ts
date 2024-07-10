import { IsNumber, IsObject, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { EnvelopeContentDto } from '~/accounts/messages/_dto/envelope-content.dto'
import { BodyStructureDto } from '~/accounts/messages/_dto/body-structure.dto'

export class FetchMessageDto {
  @IsNumber()
  @ApiProperty()
  public seq: number

  @IsObject()
  @ApiProperty()
  public flags: Set<string>

  @IsNumber()
  @ApiProperty()
  public uid: number

  @IsObject()
  @ApiProperty({ type: EnvelopeContentDto })
  public envelope: EnvelopeContentDto

  @IsObject()
  @ApiProperty({ type: BodyStructureDto })
  public bodyStructure: BodyStructureDto

  @IsString()
  @ApiProperty()
  public id: string
}
