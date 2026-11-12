import { IColumnDataTypeFieldProps, IColumnDataTypePropertyField } from '../types'

/**
 * Controls the configurable property fields for a column renderer.
 */
export interface IDataTypeFieldsProps extends Pick<
  IColumnDataTypeFieldProps,
  'dataTypeProperties'
> {
  fields: IColumnDataTypePropertyField[]
  isFieldsVisible: boolean
  toggleIsFieldsVisible: () => void
}
