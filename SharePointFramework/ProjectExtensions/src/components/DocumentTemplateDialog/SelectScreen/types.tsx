import { Selection } from '@fluentui/react/lib/DetailsList'

export interface ISelectScreenProps<ItemType = any> {
  /**
   * Selection
   */
  selection: Selection

  /**
   * Selected items
   */
  selectedItems: ItemType[]
}
