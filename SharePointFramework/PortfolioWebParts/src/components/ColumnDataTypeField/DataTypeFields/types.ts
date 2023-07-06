import { IColumnDataTypeFieldProps, IColumnDataTypePropertyField } from '../types'

export interface IDataTypeFieldsProps
  extends Pick<IColumnDataTypeFieldProps, 'dataTypeProperties'> {
  fields: IColumnDataTypePropertyField[]
  isFieldsVisible: boolean
  toggleIsFieldsVisible: () => void
}
