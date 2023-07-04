import { createAction } from '@reduxjs/toolkit'
import {
  AutocompleteSelectCallback,
  IAutocompleteProps,
  ISuggestionItem
} from './types'

export const INIT = createAction<{ props: IAutocompleteProps }>('INIT')
export const RESET = createAction('RESET')
export const ON_SEARCH = createAction<{ searchTerm: string }>('ON_SEARCH')
export const ON_KEY_DOWN = createAction<{
  key: string
  onEnter: AutocompleteSelectCallback
}>('ON_KEY_DOWN')
export const SET_SELECTED_INDEX =
  createAction<{ index: number }>('SET_SELECTED_INDEX')
export const DISMISS_CALLOUT =
  createAction<{ item: ISuggestionItem<any> }>('DISMISS_CALLOUT')
