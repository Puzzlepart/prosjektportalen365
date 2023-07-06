import { IColumn } from '@fluentui/react'
import { ColumnDataType } from 'pp365-shared-library'
import { IColumnDataTypeFieldOption } from './ColumnDataTypeField'

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
export interface ColumnRenderComponent<T extends IRenderItemColumnProps = IRenderItemColumnProps>
  extends React.FunctionComponent<T> {
  /**
   * The key of the data type for internal use. This is used to identify the data type
   * in the data type field dropdown.
   */
  key: ColumnDataType

  /**
   * The ID of the data type. This corresponds to the actual value
   * in the Data Type choice field in the list.
   */
  id: string

  /**
   * Display name of the column render component. This is used in the data type field dropdown,
   * and will be displayed to the end users.
   */
  displayName: string

  /**
   * The name of the icon to use for the data type field.
   */
  iconName: string

  /**
   * Gets an dropdown option for the data type field.
   *
   * @returns An option for the data type field.
   */
  getDataTypeOption?: () => IColumnDataTypeFieldOption
}
