import { List, Item } from '@pnp/sp'
export interface IPropertyItemContext {
  itemId?: number
  listId?: string
  defaultEditFormUrl?: string
  list?: List
  item?: Item
}
