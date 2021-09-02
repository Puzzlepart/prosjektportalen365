import { Selection } from 'office-ui-fabric-react/lib/DetailsList'

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
