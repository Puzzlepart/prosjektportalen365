import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProgramAdministrationState } from './types'

export const DATA_LOADED = createAction<{
  data: Partial<IProgramAdministrationState>
  scope: string
}>('DATA_LOADED')
export const TOGGLE_ADD_PROJECT_DIALOG = createAction('TOGGLE_ADD_PROJECT_DIALOG')
export const ADD_CHILD_PROJECTS = createAction('ADD_CHILD_PROJECTS')
export const CHILD_PROJECTS_REMOVED = createAction<{
  childProjects: Record<string, string>[]
}>('CHILD_PROJECTS_REMOVED')
export const SET_SELECTED_TO_ADD = createAction<{
  selected: Record<string, string>[]
}>('SET_SELECTED_TO_ADD')
export const SET_SELECTED_TO_DELETE = createAction<{
  selected: Record<string, string>[]
}>('SET_SELECTED_TO_DELETE')

export const initialState: IProgramAdministrationState = {
  loading: {
    root: true,
    AddProjectDialog: true
  },
  childProjects: [],
  availableProjects: [],
  selectedProjectsToAdd: [],
  selectedProjectsToDelete: [],
  error: null
}

/**
 * Append keys to all items in the array
 *
 * @param items Items
 * @param keyProperty Key property
 */
function appendKey(items: any[], keyProperty: string) {
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
    state.selectedProjectsToDelete = []
  },
  [ADD_CHILD_PROJECTS.type]: (state: IProgramAdministrationState) => {
    state.childProjects = [...state.childProjects, ...state.selectedProjectsToAdd]
    state.selectedProjectsToAdd = []
    state.displayAddProjectDialog = false
  },
  [CHILD_PROJECTS_REMOVED.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof CHILD_PROJECTS_REMOVED>
  ) => {
    state.childProjects = payload.childProjects
    state.selectedProjectsToDelete = []
  },
  [SET_SELECTED_TO_ADD.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof SET_SELECTED_TO_ADD>
  ) => {
    state.selectedProjectsToAdd = payload.selected
  },
  [SET_SELECTED_TO_DELETE.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof SET_SELECTED_TO_DELETE>
  ) => {
    state.selectedProjectsToDelete = payload.selected
  }
})
