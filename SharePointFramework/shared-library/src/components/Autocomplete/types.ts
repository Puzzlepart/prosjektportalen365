import { ISearchBoxProps } from '@fluentui/react'
import { ISuggestionItem } from './SuggestionItem/types'

/**
 * @ignore
 */
export type AutocompleteSelectCallback<T = any> = (
  item: ISuggestionItem<T>
) => void

/**
 * @ignore
 */
export type AutocompleteItemIcons = {
  style: React.CSSProperties
}

/**
 * @category Autocomplete
 */
export interface IAutocompleteProps<T = any> extends ISearchBoxProps {
  /**
   * Label for the autocomplete component.
   */
  label?: string

  /**
   * Provide the key of the selected item. This will be used to clear
   * the selection when the provided key is `null`.
   */
  selectedKey?: string

  /**
   * Description for the autocomplete component.
   */
  description?: string

  /**
   * Icons to be displayed next to each item.
   */
  itemIcons?: AutocompleteItemIcons | boolean

  /**
   * Callback to be called when an item is selected.
   */
  onSelected: AutocompleteSelectCallback<T>

  /**
   * Items to be displayed in the autocomplete component.
   */
  items?: ISuggestionItem<T>[]

  /**
   * Text to be displayed when there are no suggestions.
   */
  noSuggestionsText?: string

  /**
   * Default selected key.
   */
  defaultSelectedKey?: string

  /**
   * Error message to be displayed.
   */
  errorMessage?: string

  /**
   * Max height of the autocomplete component.
   */
  maxHeight?: number
}

/**
 * @category Autocomplete
 */
export interface IAutocompleteState<T = any> {
  items?: ISuggestionItem<T>[]
  suggestions?: ISuggestionItem<T>[]
  isSuggestionDisabled?: boolean
  value?: string
  selectedItem?: ISuggestionItem
  selectedIndex?: number
}

export * from './SuggestionItem/types'
