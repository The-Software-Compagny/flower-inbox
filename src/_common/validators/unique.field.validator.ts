import { Injectable } from '@nestjs/common'
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'
import { unique } from 'radash'

@Injectable()
@ValidatorConstraint({ name: 'unique', async: true })
export class UniqueFieldValidator implements ValidatorConstraintInterface {
  public validate = async (values: object[], args: ValidationArguments): Promise<boolean> => {
    const [fieldName] = args.constraints
    if (!values || !values.length) return true
    return unique(values, (v) => v[fieldName]).length === values.length
  }

  defaultMessage(args: ValidationArguments) {
    const [fieldName] = args.constraints
    return `${fieldName} must be unique`
  }
}
