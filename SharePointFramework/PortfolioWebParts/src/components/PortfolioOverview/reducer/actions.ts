import { IObjectWithKey, Selection } from '@fluentui/react'
import { createAction } from '@reduxjs/toolkit'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared-library/lib/models'
import { OnColumnContextMenu } from '../../List'
import { IColumnFormPanel } from '../ColumnFormPanel/types'

/**
 * `STARTING_DATA_FETCH`: Action dispatched when data fetch is started
 */
export const STARTING_DATA_FETCH = createAction('STARTING_DATA_FETCH')

/**
 * `DATA_FETCHED`: Action dispatched when data is fetched from SharePoint
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  currentView: PortfolioOverviewView
  groupBy: ProjectColumn
  managedProperties: string[]
}>('DATA_FETCHED')

/**
 * `DATA_FETCH_ERROR`: Action dispatched when data fetch fails
 */
export const DATA_FETCH_ERROR = createAction<{ error: Error; view: PortfolioOverviewView }>(
  'DATA_FETCH_ERROR'
)

/**
 * `EXECUTE_SEARCH`: Action dispatched when user executes a search
 */
export const EXECUTE_SEARCH = createAction<string>('EXECUTE_SEARCH')

/**
 * `TOGGLE_FILTER_PANEL`: Action dispatched when user toggles the filter panel
 */
export const TOGGLE_FILTER_PANEL = createAction('TOGGLE_FILTER_PANEL')

/**
 * `START_EXCEL_EXPORT`: Action dispatched when user starts an Excel export
 */
export const START_EXCEL_EXPORT = createAction('START_EXCEL_EXPORT')

/**
 * `EXCEL_EXPORT_SUCCESS`: Action dispatched when Excel export is successful
 */
export const EXCEL_EXPORT_SUCCESS = createAction('EXCEL_EXPORT_SUCCESS')

/**
 * `EXCEL_EXPORT_ERROR`: Action dispatched when Excel export fails
 */
export const EXCEL_EXPORT_ERROR = createAction<Error>('EXCEL_EXPORT_ERROR')

/**
 * `TOGGLE_COMPACT`: Action dispatched when user toggles compact mode for the list
 */
export const TOGGLE_COMPACT = createAction('TOGGLE_COMPACT')

/**
 * `CHANGE_VIEW`: Action dispatched when user changes the view
 */
export const CHANGE_VIEW = createAction<PortfolioOverviewView>('CHANGE_VIEW')

/**
 * `ON_FILTER_CHANGED`: Action dispatched when user changes a filter
 */
export const ON_FILTER_CHANGED = createAction<{
  column: ProjectColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGED')

/**
 * `TOGGLE_COLUMN_CONTEXT_MENU`: Action dispatched when user opens the column context menu
 */
export const TOGGLE_COLUMN_CONTEXT_MENU = createAction<OnColumnContextMenu>(
  'TOGGLE_COLUMN_CONTEXT_MENU'
)

/**
 * `SET_GROUP_BY`: Action dispatched when user changes the group by column
 */
export const SET_GROUP_BY = createAction<ProjectColumn>('SET_GROUP_BY')

/**
 * `SET_SORT`: Action dispatched when user changes the sort column
 */
export const SET_SORT = createAction<{
  column: ProjectColumn
  isSortedDescending?: boolean
  customSort?: ProjectColumnCustomSort
}>('SET_SORT')

/**
 * `SELECTION_CHANGED`: Action dispatched when user changes the selection in the list
 */
export const SELECTION_CHANGED = createAction<Selection<IObjectWithKey>>('SELECTION_CHANGED')

/**
 * `TOGGLE_COLUMN_FORM_PANEL`: Toggling the column form panel.
 */
export const TOGGLE_COLUMN_FORM_PANEL = createAction<IColumnFormPanel>('TOGGLE_COLUMN_FORM_PANEL')

/**
 * `COLUMN_FORM_PANEL_ON_SAVED`: Column form panel on saved.
 */
export const COLUMN_FORM_PANEL_ON_SAVED = createAction<{
  column: ProjectColumn
  isNew: boolean
}>('COLUMN_FORM_PANEL_ON_SAVED')

/**
 * `COLUMN_DELETED`: Column deleted - updates the `columns` and `columnForm` state
 */
export const COLUMN_DELETED = createAction<{ columnId: any }>('COLUMN_DELETED')

/**
 * `TOGGLE_EDIT_VIEW_COLUMNS_PANEL`: Toggling the show/hide column panel.
 */
export const TOGGLE_EDIT_VIEW_COLUMNS_PANEL = createAction<{
  isOpen: boolean
  columns?: ProjectColumn[]
  revertColumnOrder?: boolean
}>('TOGGLE_EDIT_VIEW_COLUMNS_PANEL')

/**
 * `TOGGLE_VIEW_FORM_PANEL`: Toggling the view form panel.
 */
export const TOGGLE_VIEW_FORM_PANEL = createAction<{
  isOpen: boolean
  view?: PortfolioOverviewView
}>('TOGGLE_VIEW_FORM_PANEL')
