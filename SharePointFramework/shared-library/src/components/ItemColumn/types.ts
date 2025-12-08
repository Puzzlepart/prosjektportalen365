import { IColumn } from '@fluentui/react'
import { ColumnDataType, ProjectColumn } from 'pp365-shared-library'
import { GetDataTypeProperties, IColumnDataTypeFieldOption } from './ColumnDataTypeField'
import { IWeb } from '@pnp/sp/webs'

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
   * Indicates whether the column render component is disabled, the option will be
   * disabled in the data type field dropdown, but will still be visible.
   */
  isDisabled?: boolean

  /**
   * Gets an dropdown option for the data type field.
   *
   * @returns An option for the data type field.
   */
  getDataTypeOption?: () => IColumnDataTypeFieldOption

  /**
   * Function that returns an array of data type properties for the component.
   */
  getDataTypeProperties?: GetDataTypeProperties

  /**
   * Optional data fetch function that will be called if a column using the
   * component is used.
   *
   * @param web The web instance to fetch data from.
   * @param column The column to fetch data for.
   */
  fetchData?: (web?: IWeb, column?: ProjectColumn) => Promise<any>
}
