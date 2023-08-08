import { IItem } from '@pnp/sp/items'
import { IList } from '@pnp/sp/lists'

export interface IPropertyItemContext {
  itemId?: number
  listId?: string
  defaultEditFormUrl?: string
  list?: IList
  item?: IItem
}
