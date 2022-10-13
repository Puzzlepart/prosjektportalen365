import { IColumn } from '@fluentui/react/lib/DetailsList'

export interface IAggregatedSearchListColumn extends IColumn {
  /**
   * Is the column groupable
   */
  isGroupable?: boolean

  /**
   * Field name for display
   */
  fieldNameDisplay?: string
}
