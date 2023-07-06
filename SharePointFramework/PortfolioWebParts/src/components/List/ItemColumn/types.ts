import { IColumn } from '@fluentui/react'
import { ColumnDataType } from 'pp365-shared-library'
import { IColumnDataTypeFieldOption } from '../../ColumnDataTypeField/types'

export interface IRenderItemColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  column?: IColumn
  item?: Record<string, any>
  columnValue?: string
  dataTypeProperties?: Map<string, any>
}

export type ItemColumnRenderFunction = (props: IRenderItemColumnProps) => JSX.Element

/**
 * Interface for a component that renders a column in a list item.
 * 
 * @template T - The type of the props passed to the component.
 */
export interface ColumnRenderComponent<T extends IRenderItemColumnProps>
  extends React.FunctionComponent<T> {
  key: ColumnDataType
  id: string
  displayName: string
  iconName: string
  getDataTypeOption: () => IColumnDataTypeFieldOption
}
