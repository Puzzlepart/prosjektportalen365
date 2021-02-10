import { IColumn, Selection } from 'office-ui-fabric-react/lib/DetailsList'

export interface ISelectScreenProps<ItemType = any> {
  /**
   * Selection
   */
  selection: Selection

  /**
   * Columns
   */
  columns?: IColumn[]

  /**
   * Selected items
   */
  selectedItems: ItemType[]
}
