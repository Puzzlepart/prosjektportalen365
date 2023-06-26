import { IDetailsHeaderProps, ISearchBoxProps, SelectAllVisibility } from '@fluentui/react'
import { UserSelectableObject } from '../../../models/UserSelectableObject'

export interface IListHeaderSearchProps {
  /**
   * Current selected items
   */
  selectedItems: UserSelectableObject[]

  /**
   * Search box properties
   */
  search?: ISearchBoxProps

  /**
   * Details header properties
   */
  detailsHeaderProps: IDetailsHeaderProps

  /**
   * Default render function for the details header
   */
  defaultRender: (props?: IDetailsHeaderProps) => JSX.Element

  /**
   * Select all visibility
   */
  selectAllVisibility?: SelectAllVisibility
}
