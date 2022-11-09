import { IObjectWithKey } from '@fluentui/react'
import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProgramAdministrationState } from './types'

export const DATA_LOADED =
  createAction<{ data: Partial<IProgramAdministrationState>; scope: string }>('DATA_LOADED')
export const TOGGLE_ADD_PROJECT_DIALOG = createAction('TOGGLE_ADD_PROJECT_DIALOG')
export const CHILD_PROJECTS_ADDED =
  createAction<{ childProjects: Array<Record<string, string>> }>('CHILD_PROJECTS_ADDED')
export const CHILD_PROJECTS_REMOVED =
  createAction<{ childProjects: Array<Record<string, string>> }>('CHILD_PROJECTS_REMOVED')
export const SET_SELECTED_TO_DELETE =
  createAction<{ selected: Array<Record<string, string>> }>('SET_SELECTED_TO_DELETE')

export const initialState: IProgramAdministrationState = {
  loading: {
    root: true,
    AddProjectDialog: true
  },
  childProjects: [],
  availableProjects: [],
  displayAddProjectDialog: true,
  selectedProjectsToDelete: [],
  error: null
}

/**
 * Append keys to all items in the array
 *
 * @param items Items
 * @param keyProperty Key property
 */
function appendKey(items: any[], keyProperty: string): IObjectWithKey[] {
  return items.map((i) => ({
    key: i[keyProperty],
    ...i
  }))
}

export default createReducer(initialState, {
  [DATA_LOADED.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof DATA_LOADED>
  ) => {
    state.childProjects = payload.data.childProjects
      ? appendKey(payload.data.childProjects, 'SiteId')
      : state.childProjects
    state.availableProjects = payload.data.availableProjects
      ? appendKey(payload.data.availableProjects, 'SiteId')
      : state.availableProjects
    state.userHasManagePermission =
      payload.data.userHasManagePermission ?? state.userHasManagePermission
    state.loading = {
      ...state.loading,
      [payload.scope]: false
    }
  },
  [TOGGLE_ADD_PROJECT_DIALOG.type]: (state: IProgramAdministrationState) => {
    state.displayAddProjectDialog = !state.displayAddProjectDialog
  },
  [CHILD_PROJECTS_ADDED.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof CHILD_PROJECTS_ADDED>
  ) => {
    state.childProjects = [...state.childProjects, ...payload.childProjects]
    state.displayAddProjectDialog = false
  },
  [CHILD_PROJECTS_REMOVED.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof CHILD_PROJECTS_REMOVED>
  ) => {
    state.childProjects = payload.childProjects
    state.selectedProjectsToDelete = []
  },
  [SET_SELECTED_TO_DELETE.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof SET_SELECTED_TO_DELETE>
  ) => {
    state.selectedProjectsToDelete = payload.selected
  }
})
