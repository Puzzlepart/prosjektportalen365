import { IColumnRenderFieldProps } from '../types'
import { useDataTypeProperties } from '../useDataTypeProperties'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IDataTypeFieldsProps
  extends ReturnType<typeof useDataTypeProperties>,
    Pick<IColumnRenderFieldProps, 'dataTypeProperties'> {}
