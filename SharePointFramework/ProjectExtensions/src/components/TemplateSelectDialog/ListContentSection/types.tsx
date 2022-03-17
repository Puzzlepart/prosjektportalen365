import { ListContentConfig } from '../../../models/index'

export interface IListContentSectionProps {
  /**
   * List content config
   */
  listContentConfig?: ListContentConfig[]

  /**
   * Currently selected list content config
   */
  selectedListContentConfig?: ListContentConfig[]

  /**
   * Locks (disables) the default list content config
   */
  lockDefault?: boolean

  /**
   * On list content config changed
   */
  onChange: (selectedListConfig: ListContentConfig[]) => void
}
