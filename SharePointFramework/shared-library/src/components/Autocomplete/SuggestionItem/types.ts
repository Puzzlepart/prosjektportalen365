import { IDropdownOption } from '@fluentui/react'
import { IAutocompleteProps } from '../types'

/**
 * @category Autocomplete
 */
export interface ISuggestionItem<T = any> extends IDropdownOption {
  searchValue: string
  secondaryText?: string
  iconName?: string
  type?: string
  tag?: any
  data?: T
  isSelected?: boolean
}

/**
 * @category Autocomplete
 */
export interface ISuggestionItemProps
  extends React.HTMLProps<HTMLDivElement>,
    Pick<IAutocompleteProps, 'itemIcons'> {
  item: ISuggestionItem
}
