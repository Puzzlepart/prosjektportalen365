import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProgramAdministrationProject, IProgramAdministrationState } from './types'

export const DATA_LOADED = createAction<{
  data: Partial<IProgramAdministrationState>
  scope: string
}>('DATA_LOADED')
export const TOGGLE_ADD_PROJECT_DIALOG = createAction('TOGGLE_ADD_PROJECT_DIALOG')
export const ADD_CHILD_PROJECTS =
  createAction<IProgramAdministrationProject[]>('ADD_CHILD_PROJECTS')
export const REMOVE_CHILD_PROJECTS = createAction<{ siteIdsToRemove: string[] }>(
  'REMOVE_CHILD_PROJECTS'
)
export const SET_IS_DELETING = createAction<boolean>('SET_IS_DELETING')
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
  isDeleting: false,
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

export default createReducer(initialState, (builder) =>
  builder
    .addCase(DATA_LOADED, (state, { payload }) => {
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
    })
    .addCase(TOGGLE_ADD_PROJECT_DIALOG, (state) => {
      state.addProjectDialog = {
        open: !state.addProjectDialog.open,
        loading: false,
        selectedProjects: []
      }
      state.selectedProjects = []
    })
    .addCase(ADD_CHILD_PROJECTS, (state, { payload }) => {
      state.childProjects = [...state.childProjects, ...payload]
      state.selectedProjects = []
      state.addProjectDialog = {
        open: false,
        loading: false,
        selectedProjects: []
      }
    })
    .addCase(REMOVE_CHILD_PROJECTS, (state, { payload }) => {
      state.childProjects = state.childProjects.filter(
        (p) => !payload.siteIdsToRemove.includes(p.SiteId)
      )
      state.selectedProjects = []
      state.isDeleting = false
    })
    .addCase(SET_SELECTED_TO_ADD, (state, { payload }) => {
      state.addProjectDialog = {
        ...state.addProjectDialog,
        selectedProjects: payload
      }
    })
    .addCase(SET_SELECTED_TO_DELETE, (state, { payload }) => {
      state.selectedProjects = payload
    })
    .addCase(SET_IS_DELETING, (state, { payload }) => {
      state.isDeleting = payload
    })
)
