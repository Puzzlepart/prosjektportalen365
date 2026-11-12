import { createAction } from '@reduxjs/toolkit'
import { ProjectContentColumn } from 'pp365-shared-library'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { OnColumnContextMenu } from '../../List'
import { IColumnFormPanel } from '../ColumnFormPanel/types'

/**
 * Apply fetched rows and reconcile the view's selected and available columns.
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  projects?: any[]
  dataSources?: DataSource[]
  columns?: ProjectContentColumn[]
  dataSource?: DataSource
}>('DATA_FETCHED')

/**
 * Set column-editor visibility and the optional column to edit.
 */
export const TOGGLE_COLUMN_FORM_PANEL = createAction<IColumnFormPanel>('TOGGLE_COLUMN_FORM_PANEL')

/**
 * Set column-selection panel visibility and apply saved columns when supplied.
 */
export const TOGGLE_EDIT_VIEW_COLUMNS_PANEL = createAction<{
  isOpen: boolean
  columns?: ProjectContentColumn[]
}>('TOGGLE_EDIT_VIEW_COLUMNS_PANEL')

/**
 * Open or close the filter panel.
 */
export const TOGGLE_FILTER_PANEL = createAction('TOGGLE_FILTER_PANEL')

/**
 * `TOGGLE_COMPACT`: Sets the compact mode to the payload (`true` compact, `false` the normal
 * list); without a payload it flips the mode.
 */
export const TOGGLE_COMPACT = createAction<boolean>('TOGGLE_COMPACT')

/**
 * Insert or replace a saved column and persist the selected columns.
 */
export const COLUMN_FORM_PANEL_ON_SAVED = createAction<{
  column: ProjectContentColumn
  isNew: boolean
}>('COLUMN_FORM_PANEL_ON_SAVED')

/**
 * Remove a deleted column from available and selected columns and persist the selection.
 */
export const COLUMN_DELETED = createAction<{ columnId: any }>('COLUMN_DELETED')

/**
 * Set or clear the selected column and its menu anchor.
 */
export const TOGGLE_COLUMN_CONTEXT_MENU = createAction<OnColumnContextMenu>(
  'TOGGLE_COLUMN_CONTEXT_MENU'
)

/**
 * `SET_GROUP_BY`: The user's choice in the column menu: groups by the column, or ends the grouping
 * when the rows are already grouped by it.
 */
export const SET_GROUP_BY = createAction<{ column: ProjectContentColumn }>('SET_GROUP_BY')

/**
 * `SET_VIEW_GROUP_BY`: Dispatched after a fetch with the view's group column: groups by it, or ends
 * the grouping when the view has none. Unlike `SET_GROUP_BY` it never toggles, so a view grouped
 * by the column the rows are already grouped by stays grouped.
 */
export const SET_VIEW_GROUP_BY = createAction<{ column: ProjectContentColumn }>('SET_VIEW_GROUP_BY')

/**
 * `SET_SORT`: Sorts by the column, descending (Å to A) when `isSortedDescending` is `true`; without
 * `isSortedDescending` it flips the column's current direction.
 */
export const SET_SORT = createAction<{ column: ProjectContentColumn; isSortedDescending: boolean }>(
  'SET_SORT'
)

/**
 * Resolve the current view from URL, web-part properties or configured defaults.
 */
export const SET_CURRENT_VIEW = createAction('SET_CURRENT_VIEW')

/**
 * Select a different data-source view and clear active filters.
 */
export const SET_DATA_SOURCE = createAction<{ dataSource: DataSource }>('SET_DATA_SOURCE')

/**
 * Mark the aggregation as loading.
 */
export const START_FETCH = createAction('START_FETCH')

/**
 * Store the search term for client-side filtering.
 */
export const EXECUTE_SEARCH = createAction<string>('EXECUTE_SEARCH')

/**
 * `GET_FILTERS`: Build the filter panel from a list of refiner columns.
 * `group` and `defaultCollapsed` forward straight to the filter panel.
 */
export const GET_FILTERS = createAction<{
  filters: Array<{ column: any; group?: string; defaultCollapsed?: boolean }>
}>('GET_FILTERS')

/**
 * Replace a column's active filter values and synchronize filter-panel selection.
 */
export const ON_FILTER_CHANGE = createAction<{
  column: ProjectContentColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGE')

/**
 * Stop loading and view switching and store the fetch failure.
 */
export const DATA_FETCH_ERROR = createAction<{ error: Error }>('DATA_FETCH_ERROR')

/**
 * Set view-editor state or apply an added/edited data-source view and close the editor.
 */
export const SET_VIEW_FORM_PANEL = createAction<{
  isOpen: boolean
  view?: DataSource
  submitAction?: 'add' | 'edit'
}>('SET_VIEW_FORM_PANEL')

/**
 * Store selected rows for export.
 */
export const SELECTION_CHANGED = createAction<Record<string, any>[]>('SELECTION_CHANGED')
