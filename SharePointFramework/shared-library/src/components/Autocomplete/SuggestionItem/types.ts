import { IAutocompleteProps } from '../types'

/**
 * @category Autocomplete
 */
export interface ISuggestionItem<T = any> {
  /**
   * Unique key for the suggestion.
   */
  key: string | number

  /**
   * Text shown for the suggestion.
   */
  text: string

  /**
   * Whether the suggestion can be selected.
   */
  disabled?: boolean

  /**
   * Position of the suggestion in the list.
   */
  index?: number

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
  extends React.HTMLProps<HTMLDivElement>, Pick<IAutocompleteProps, 'itemIcons'> {
  item: ISuggestionItem
}
