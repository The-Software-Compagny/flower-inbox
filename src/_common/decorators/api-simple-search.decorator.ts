import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels } from '@nestjs/swagger'
import { ApiResponseOptions } from '@nestjs/swagger/dist/decorators/api-response.decorator'
import { ApiPaginatedResponseDecorator } from '~/_common/decorators/api-paginated-response.decorator'
import { PaginatedFilterDto } from '~/_common/dto/paginated-filter.dto'

export const ApiSimpleSearchDecorator = <TModel extends Type<any>>(model: TModel, options?: ApiResponseOptions | null | undefined) => {
  return applyDecorators(ApiExtraModels(PaginatedFilterDto), ApiPaginatedResponseDecorator(model, options))
}
