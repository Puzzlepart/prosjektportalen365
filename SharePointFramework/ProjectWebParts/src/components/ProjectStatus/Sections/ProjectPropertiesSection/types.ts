import { TypedHash } from '@pnp/common'
import { SPField } from 'pp365-shared/lib/models'
import { IEntityField } from 'sp-entityportal-service'
import { IBaseSectionProps } from '../BaseSection'

type Field = SPField | IEntityField

export interface IProjectPropertiesSectionProps extends IBaseSectionProps {
  /**
   * Fields
   */
  fields: Field[]

  /**
   * Field values
   */
  fieldValues: TypedHash<string>

  /**
   * Field width
   */
  fieldWidth: number
}
