import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProgramAdministrationProject, IProgramAdministrationState } from './types'

export const DATA_LOADED = createAction<{
  data: Partial<IProgramAdministrationState>
  scope: string
}>('DATA_LOADED')
export const TOGGLE_ADD_PROJECT_DIALOG = createAction('TOGGLE_ADD_PROJECT_DIALOG')
export const ADD_CHILD_PROJECTS =
  createAction<IProgramAdministrationProject[]>('ADD_CHILD_PROJECTS')
export const CHILD_PROJECTS_REMOVED = createAction<{ childProjects: Record<string, string>[] }>(
  'CHILD_PROJECTS_REMOVED'
)
export const SET_SELECTED_TO_ADD =
  createAction<IProgramAdministrationState['addProjectDialog']['selectedProjects']>(
    'SET_SELECTED_TO_ADD'
  )
export const SET_SELECTED_TO_DELETE =
  createAction<IProgramAdministrationState['selectedProjects']>('SET_SELECTED_TO_DELETE')

/**
 * Initial state for the `ProgramAdministration` reducer.
 */
export const initialState: IProgramAdministrationState = {
  loading: true,
  addProjectDialog: {
    open: false,
    loading: false,
    selectedProjects: []
  },
  childProjects: [],
  availableProjects: [],
  selectedProjects: [],
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
    if (payload.scope === 'AddProjectDialog') {
      state.addProjectDialog = {
        ...state.addProjectDialog,
        loading: false
      }
    } else {
      state.loading = false
    }
  },
  [TOGGLE_ADD_PROJECT_DIALOG.type]: (state: IProgramAdministrationState) => {
    state.addProjectDialog = {
      open: !state.addProjectDialog.open,
      loading: false,
      selectedProjects: []
    }
    state.selectedProjects = []
  },
  [ADD_CHILD_PROJECTS.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof ADD_CHILD_PROJECTS>
  ) => {
    state.childProjects = [...state.childProjects, ...payload]
    state.selectedProjects = []
    state.addProjectDialog = {
      open: false,
      loading: false,
      selectedProjects: []
    }
  },
  [CHILD_PROJECTS_REMOVED.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof CHILD_PROJECTS_REMOVED>
  ) => {
    state.childProjects = payload.childProjects
    state.selectedProjects = []
  },
  [SET_SELECTED_TO_ADD.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof SET_SELECTED_TO_ADD>
  ) => {
    state.addProjectDialog = {
      ...state.addProjectDialog,
      selectedProjects: payload
    }
  },
  [SET_SELECTED_TO_DELETE.type]: (
    state: IProgramAdministrationState,
    { payload }: ReturnType<typeof SET_SELECTED_TO_DELETE>
  ) => {
    state.selectedProjects = payload
  }
})
