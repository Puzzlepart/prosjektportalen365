import { IListColumn } from '../../useColumns'

/**
 * Re-export IListColumn as IListViewColumn for backward compatibility.
 * Both represent a Fluent UI table column with sizing metadata.
 */
export type IListViewColumn<T = any> = IListColumn

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
