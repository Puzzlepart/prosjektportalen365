import { CSSProperties } from 'react'

export type AutocompleteSelectCallback<T = any> = (item: ISuggestionItem<T>) => void

export type AutocompleteItemIcons = {
  style: CSSProperties
}

/**
 * An item the autocomplete offers.
 */
export interface ISuggestionItem<T = any> {
  /**
   * Identifies the item; `defaultSelectedKey` and `selectedKey` name it by this.
   */
  key: string | number

  /**
   * Shown in the list, and in the input once picked.
   */
  text: string

  /**
   * Whether the item can be picked.
   */
  disabled?: boolean

  /**
   * Position of the item in `items`.
   */
  index?: number

  /**
   * Matched against what is typed, ignoring case.
   */
  searchValue: string

  /**
   * Secondary text of the item.
   */
  secondaryText?: string

  /**
   * Icon shown before the text when `itemIcons` is set.
   */
  iconName?: string

  /**
   * Type of the item, for the caller.
   */
  type?: string

  /**
   * Anything the caller keeps with the item.
   */
  tag?: any

  /**
   * Data of the item, for the caller.
   */
  data?: T

  /**
   * Whether the item is selected.
   */
  isSelected?: boolean
}

export interface IAutocompleteProps<T = any> {
  /**
   * Label of the field; with a label, a description or an error message the autocomplete is
   * wrapped in a Fluent `Field`.
   */
  label?: string

  /**
   * Shown under the input as a hint.
   */
  description?: string

  /**
   * Shown under the input as an error.
   */
  errorMessage?: string

  /**
   * Marks the field as required.
   */
  required?: boolean

  /**
   * Shown in the empty input.
   */
  placeholder?: string

  /**
   * Disables the input.
   */
  disabled?: boolean

  /**
   * Class of the input.
   */
  className?: string

  /**
   * Items to offer; plain strings are their own key, text and search value.
   */
  items?: ISuggestionItem<T>[] | string[]

  /**
   * Key of the item picked from the start.
   */
  defaultSelectedKey?: string

  /**
   * Set to `null` to clear the input.
   */
  selectedKey?: string

  /**
   * Called with the item picked.
   */
  onSelected: AutocompleteSelectCallback<T>

  /**
   * Called when the input is cleared.
   */
  onClear?: () => void

  /**
   * Shown in the list when nothing matches what is typed; without it, the list is empty.
   */
  noSuggestionsText?: string

  /**
   * Show the items' icons.
   */
  itemIcons?: AutocompleteItemIcons | boolean

  /**
   * Largest height of the list, in pixels.
   */
  maxHeight?: number
}
