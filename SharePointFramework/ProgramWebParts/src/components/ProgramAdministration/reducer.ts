import { createAction, createReducer } from '@reduxjs/toolkit'
import { IChildProject } from 'types/IChildProject'
import { IProgramAdministrationState } from './types'

export const DATA_LOADED =
  createAction<{ data: Partial<IProgramAdministrationState>; scope: string }>('DATA_LOADED')
export const TOGGLE_ADD_PROJECT_DIALOG = createAction('TOGGLE_ADD_PROJECT_DIALOG')
export const CHILD_PROJECTS_ADDED =
  createAction<{ childProjects: IChildProject[] }>('CHILD_PROJECTS_ADDED')
export const CHILD_PROJECTS_REMOVED =
  createAction<{ childProjects: IChildProject[] }>('CHILD_PROJECTS_REMOVED')
export const SET_SELECTED_TO_DELETE = createAction<{ selected: any[] }>('SET_SELECTED_TO_DELETE')

export const initState = (): IProgramAdministrationState => ({
  loading: {
    root: true,
    AddProjectDialog: true
  },
  childProjects: [],
  availableProjects: [],
  displayAddProjectDialog: false,
  selectedProjectsToDelete: null,
  error: null
})

export default createReducer(initState(), {
  [DATA_LOADED.type]: (state, { payload }: ReturnType<typeof DATA_LOADED>) => {
    state.childProjects = payload.data.childProjects ?? state.childProjects
    state.availableProjects = payload.data.availableProjects ?? state.availableProjects
    state.userHasManagePermission =
      payload.data.userHasManagePermission ?? state.userHasManagePermission
    state.loading = {
      ...state.loading,
      [payload.scope]: false
    }
  },
  [TOGGLE_ADD_PROJECT_DIALOG.type]: (state) => {
    state.displayAddProjectDialog = !state.displayAddProjectDialog
  },
  [CHILD_PROJECTS_ADDED.type]: (state, { payload }: ReturnType<typeof CHILD_PROJECTS_ADDED>) => {
    state.childProjects = [...state.childProjects, ...payload.childProjects]
    state.displayAddProjectDialog = false
  },
  [CHILD_PROJECTS_REMOVED.type]: (
    state,
    { payload }: ReturnType<typeof CHILD_PROJECTS_REMOVED>
  ) => {
    state.childProjects = payload.childProjects
    state.selectedProjectsToDelete = []
  },
  [SET_SELECTED_TO_DELETE.type]: (
    state,
    { payload }: ReturnType<typeof SET_SELECTED_TO_DELETE>
  ) => {
    state.selectedProjectsToDelete = payload.selected
  }
})
