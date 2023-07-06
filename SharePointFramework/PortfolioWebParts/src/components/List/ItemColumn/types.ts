import { IColumn } from '@fluentui/react'
import { IColumnDataTypeFieldOption } from '../../ColumnDataTypeField/types'

export interface IRenderItemColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  column?: IColumn
  item?: Record<string, any>
  columnValue?: string
  dataTypeProperties?: Map<string, any>
}

export type ItemColumnRenderFunction = (props: IRenderItemColumnProps) => JSX.Element

export interface ColumnRenderComponent<T extends IRenderItemColumnProps>
  extends React.FunctionComponent<T> {
  key: string
  id: string
  displayName: string
  iconName: string
  getDataTypeOption: () => IColumnDataTypeFieldOption
}
