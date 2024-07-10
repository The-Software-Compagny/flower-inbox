import { applyDecorators, HttpStatus, Type } from '@nestjs/common'
import { ApiExtraModels, ApiNotFoundResponse, getSchemaPath } from '@nestjs/swagger'
import { ApiOkResponse, ApiResponseOptions } from '@nestjs/swagger/dist/decorators/api-response.decorator'
import { NotFoundDto } from '~/_common/dto/not-found.dto'

export const ApiReadResponseDecorator = <TModel extends Type<any>>(
  model?: TModel,
  responseOptions?: ApiResponseOptions | null | undefined,
  notFoundOptions?: ApiResponseOptions | null | undefined,
) => {
  let extraProperties = {}
  const extraModels = []
  if (model) {
    extraModels.push(ApiExtraModels(model))
    extraProperties['data'] = {
      $ref: getSchemaPath(model),
    }
  }
  return applyDecorators(
    ...extraModels,
    ApiExtraModels(NotFoundDto),
    ApiOkResponse({
      schema: {
        properties: {
          statusCode: {
            type: 'number',
            enum: [HttpStatus.OK],
          },
          ...extraProperties,
        }
      },
      ...responseOptions,
    }),
    ApiNotFoundResponse({
      description: 'Item not found',
      schema: {
        $ref: getSchemaPath(NotFoundDto),
      },
      ...notFoundOptions,
    })
  )
}
