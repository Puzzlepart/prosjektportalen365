import { IListColumn } from '../../useColumns'

/**
 * Re-export IListColumn as IListViewColumn for backward compatibility.
 * Both represent a Fluent UI table column with sizing metadata.
 */
export type IListViewColumn<T = any> = IListColumn

/**
 * Table rows, typed columns, navigation callbacks and empty-state messages.
 */
export interface IListViewProps {
  columns: IListViewColumn[]

  items: any[]

  /**
   * The number of items before the search and the filters, told with the number shown when a
   * search or a filter changes. The items shown when not given.
   */
  total?: number

  /**
   * Flag indicating if the view is for a document library.
   */
  isDocumentLibrary?: boolean

  /**
   * Callback fired when the first column is clicked.
   * Used for drill-down functionality in DynamicListView.
   *
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

  className?: string
}
