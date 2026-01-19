import { TableColumnDefinition, TableColumnId } from '@fluentui/react-components'

/**
 * Extended column definition for ListView that includes custom rendering and sizing.
 */
export interface IListViewColumn<T = any> extends TableColumnDefinition<T> {
  /**
   * Unique identifier for the column.
   */
  columnId: TableColumnId

  /**
   * Minimum width for the column in pixels.
   */
  minWidth?: number

  /**
   * Maximum width for the column in pixels.
   */
  maxWidth?: number

  /**
   * Field name for the column (optional, for compatibility).
   */
  fieldName?: string

  /**
   * Custom render function for the header cell.
   */
  renderHeaderCell: () => React.ReactNode

  /**
   * Custom render function for the data cell.
   */
  renderCell: (item: T) => React.ReactNode
}

/**
 * Props for the base ListView component.
 */
export interface IListViewProps {
  /**
   * Array of column definitions.
   */
  columns: IListViewColumn[]

  /**
   * Array of items to display.
   */
  items: any[]

  /**
   * Flag indicating if the view is for a document library.
   */
  isDocumentLibrary?: boolean

  /**
   * Callback fired when the first column is clicked.
   * Used for drill-down functionality in DynamicListView.
   *
   * @param item - The item that was clicked
   */
  onFirstColumnClick?: (item: any) => void

  /**
   * Message to display when there are no items.
   */
  emptyMessage?: string

  /**
   * Message to display when there are no columns.
   */
  noColumnsMessage?: string

  /**
   * Additional CSS class name for styling.
   */
  className?: string
}
