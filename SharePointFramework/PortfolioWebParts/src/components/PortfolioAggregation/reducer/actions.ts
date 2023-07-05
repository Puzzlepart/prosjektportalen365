import { IGroup, Target } from '@fluentui/react'
import { createAction } from '@reduxjs/toolkit'
import { ProjectContentColumn } from 'pp365-shared-library'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { IColumnFormPanel } from '../ColumnFormPanel/types'

/**
 * `DATA_FETCHED`: Action is called after all data has been fetched.
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  projects?: any[]
  dataSources?: DataSource[]
  columns?: ProjectContentColumn[]
  dataSource?: DataSource
}>('DATA_FETCHED')

/**
 * `TOGGLE_COLUMN_FORM_PANEL`: Toggling the column form panel.
 */
export const TOGGLE_COLUMN_FORM_PANEL = createAction<IColumnFormPanel>('TOGGLE_COLUMN_FORM_PANEL')

/**
 * `TOGGLE_EDIT_VIEW_COLUMNS_PANEL`: Toggling the show/hide column panel.
 */
export const TOGGLE_EDIT_VIEW_COLUMNS_PANEL = createAction<{
  isOpen: boolean
}>('TOGGLE_EDIT_VIEW_COLUMNS_PANEL')

/**
 * `TOGGLE_FILTER_PANEL`: Toggling the filter panel.
 */
export const TOGGLE_FILTER_PANEL = createAction<{ isOpen: boolean }>('TOGGLE_FILTER_PANEL')

/**
 * `TOGGLE_COMPACT`: Toggling the compact mode.
 */
export const TOGGLE_COMPACT = createAction<{ isCompact: boolean }>('TOGGLE_COMPACT')

/**
 * `ADD_COLUMN`: Add column.
 */
export const ADD_COLUMN = createAction<{ column: ProjectContentColumn }>('ADD_COLUMN')

/**
 * `DELETE_COLUMN`: Delete column.
 */
export const DELETE_COLUMN = createAction('DELETE_COLUMN')

/**
 * `SHOW_HIDE_COLUMNS`: Show/hide columns.
 */
export const SHOW_HIDE_COLUMNS = createAction('SHOW_HIDE_COLUMNS')

/**
 * `COLUMN_HEADER_CONTEXT_MENU`: Column header context menu.
 */
export const COLUMN_HEADER_CONTEXT_MENU = createAction<{
  column: ProjectContentColumn
  target: Target
}>('COLUMN_HEADER_CONTEXT_MENU')

/**
 * `SET_GROUP_BY`: Set group by.
 */
export const SET_GROUP_BY = createAction<{ column: ProjectContentColumn }>('SET_GROUP_BY')

/**
 * `SET_COLLAPSED`: Set collapsed.
 */
export const SET_COLLAPSED = createAction<{ group: IGroup }>('SET_COLLAPSED')

/**
 * `SET_ALL_COLLAPSED`: Set all collapsed.
 */
export const SET_ALL_COLLAPSED = createAction<{ isAllCollapsed: boolean }>('SET_ALL_COLLAPSED')

/**
 * `SET_SORT`: Set sort.
 */
export const SET_SORT = createAction<{ column: ProjectContentColumn; sortDesencing: boolean }>(
  'SET_SORT'
)

/**
 * `MOVE_COLUMN`: Move column.
 */
export const MOVE_COLUMN = createAction<{ column: ProjectContentColumn; move: number }>(
  'MOVE_COLUMN'
)

/**
 * `SET_COLUMNS`: Set columns.
 */
export const SET_COLUMNS = createAction<{ columns: ProjectContentColumn[] }>('SET_COLUMNS')

/**
 * `SET_CURRENT_VIEW`: Set current view.
 */
export const SET_CURRENT_VIEW = createAction('SET_CURRENT_VIEW')

/**
 * `SET_DATA_SOURCE`: Set data source.
 */
export const SET_DATA_SOURCE = createAction<{ dataSource: DataSource }>('SET_DATA_SOURCE')

/**
 * `START_FETCH`: Start fetching data from the data source.
 */
export const START_FETCH = createAction('START_FETCH')

/**
 * `EXECUTE_SEARCH`: Executes a search.
 */
export const EXECUTE_SEARCH = createAction<string>('EXECUTE_SEARCH')

/**
 * `GET_FILTERS`: Get filters.
 */
export const GET_FILTERS = createAction<{ filters: any[] }>('GET_FILTERS')

/**
 * `ON_FILTER_CHANGE`: Filter change.
 */
export const ON_FILTER_CHANGE = createAction<{
  column: ProjectContentColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGE')

/**
 * `DATA_FETCH_ERROR`: Error fetching data from the data source.
 */
export const DATA_FETCH_ERROR = createAction<{ error: Error }>('DATA_FETCH_ERROR')
