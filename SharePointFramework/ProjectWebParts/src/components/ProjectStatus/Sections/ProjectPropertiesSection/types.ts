import { TypedHash } from '@pnp/common'
import { SPField } from 'pp365-shared/lib/models'
import { IBaseSectionProps } from '../BaseSection'

export interface IProjectPropertiesSectionProps extends IBaseSectionProps {
  /**
   * Fields
   */
  fields: SPField[]

  /**
   * Field values
   */
  fieldValues: TypedHash<string>

  /**
   * Field width
   */
  fieldWidth: number
}
