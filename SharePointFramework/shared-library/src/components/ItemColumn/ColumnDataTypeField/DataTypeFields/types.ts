import { IColumnDataTypeFieldProps, IColumnDataTypePropertyField } from '../types'

export interface IDataTypeFieldsProps
  extends Pick<IColumnDataTypeFieldProps, 'dataTypeProperties'> {
  fields: IColumnDataTypePropertyField<any>[]
  isFieldsVisible: boolean
  toggleIsFieldsVisible: () => void
}
