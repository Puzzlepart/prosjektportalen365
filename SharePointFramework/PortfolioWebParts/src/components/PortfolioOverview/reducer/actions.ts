import { createAction } from '@reduxjs/toolkit'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared-library/lib/models'
import { OnColumnContextMenu } from '../../List'
import { IColumnFormPanel } from '../ColumnFormPanel/types'
import { PortfolioInstance } from 'data'

/**
 * Mark the overview as loading.
 */
export const STARTING_DATA_FETCH = createAction('STARTING_DATA_FETCH')

/**
 * Replace view rows and configuration after a successful fetch.
 */
export const DATA_FETCHED = createAction<{
  items: any[]
  currentView: PortfolioOverviewView
  groupBy: ProjectColumn
  managedProperties: string[]
  isUserInPortfolioManagerGroup: boolean
  showChildProjectInfoInProgram: boolean
  /** The portfolios a merged view could not read. */
  failedPortfolios?: PortfolioInstance[]
}>('DATA_FETCHED')

/**
 * End loading and show a localized view-fetch error.
 */
export const DATA_FETCH_ERROR = createAction<{ error: Error; view: PortfolioOverviewView }>(
  'DATA_FETCH_ERROR'
)

/**
 * Store a lowercased search term for client-side filtering.
 */
export const EXECUTE_SEARCH = createAction<string>('EXECUTE_SEARCH')

/**
 * Open or close the filter panel.
 */
export const TOGGLE_FILTER_PANEL = createAction('TOGGLE_FILTER_PANEL')

/**
 * Mark an Excel export as running.
 */
export const START_EXCEL_EXPORT = createAction('START_EXCEL_EXPORT')

/**
 * Clear the export-progress flag after success.
 */
export const EXCEL_EXPORT_SUCCESS = createAction('EXCEL_EXPORT_SUCCESS')

/**
 * Clear the export-progress flag after failure.
 */
export const EXCEL_EXPORT_ERROR = createAction<Error>('EXCEL_EXPORT_ERROR')

/**
 * Switch between regular and compact row density.
 */
export const TOGGLE_COMPACT = createAction('TOGGLE_COMPACT')

/**
 * Select a view and update the URL and displayed columns.
 */
export const CHANGE_VIEW = createAction<PortfolioOverviewView>('CHANGE_VIEW')

/**
 * Replace or clear a column's selected filter values.
 */
export const ON_FILTER_CHANGED = createAction<{
  column: ProjectColumn
  selectedItems: IFilterItemProps[]
}>('ON_FILTER_CHANGED')

/**
 * Set the column-menu anchor and optional keyboard-resize action.
 */
export const TOGGLE_COLUMN_CONTEXT_MENU = createAction<OnColumnContextMenu>(
  'TOGGLE_COLUMN_CONTEXT_MENU'
)

/**
 * Group by a column, or clear grouping when that column is already active.
 */
export const SET_GROUP_BY = createAction<ProjectColumn>('SET_GROUP_BY')

/**
 * Sort by a column or custom order and update header direction markers.
 */
export const SET_SORT = createAction<{
  column: ProjectColumn
  isSortedDescending?: boolean
  customSort?: ProjectColumnCustomSort
}>('SET_SORT')

/**
 * Store selected rows for export.
 */
export const SELECTION_CHANGED = createAction<Record<string, any>[]>('SELECTION_CHANGED')

/**
 * Set merged-view mode and mark the view as changing.
 */
export const TOGGLE_MERGED_VIEW = createAction<boolean>('TOGGLE_MERGED_VIEW')

/**
 * Set column-editor visibility and the optional column to edit.
 */
export const TOGGLE_COLUMN_FORM_PANEL = createAction<IColumnFormPanel>('TOGGLE_COLUMN_FORM_PANEL')

/**
 * Insert or replace a saved column and close its editor.
 */
export const COLUMN_FORM_PANEL_ON_SAVED = createAction<{
  column: ProjectColumn
  isNew: boolean
}>('COLUMN_FORM_PANEL_ON_SAVED')

/**
 * Remove a deleted column, remember its ID and close the editor.
 */
export const COLUMN_DELETED = createAction<{ columnId: any }>('COLUMN_DELETED')

/**
 * Set column-selection panel visibility and apply a saved column order when supplied.
 */
export const TOGGLE_EDIT_VIEW_COLUMNS_PANEL = createAction<{
  isOpen: boolean
  columns?: ProjectColumn[]
  revertColumnOrder?: boolean
}>('TOGGLE_EDIT_VIEW_COLUMNS_PANEL')

/**
 * Set view-editor visibility and the optional view to edit.
 */
export const SET_VIEW_FORM_PANEL = createAction<{
  isOpen: boolean
  view?: PortfolioOverviewView
}>('TOGGLE_VIEW_FORM_PANEL')
