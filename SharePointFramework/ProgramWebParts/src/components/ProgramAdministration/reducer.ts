import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProgramAdministrationState } from './types'

export const DATA_LOADED =
  createAction<{ data: Partial<IProgramAdministrationState> }>('DATA_LOADED')

export const initState = (): IProgramAdministrationState => ({
  loading: false,
  displayProjectDialog: false,
  childProjects: [],
  availableProjects: [],
  selectedProjectsToDelete: null,
  error: null
})

export default createReducer(initState(), {
  [DATA_LOADED.type]: (state, { payload }: ReturnType<typeof DATA_LOADED>) => {
    state.childProjects = payload.data.childProjects ?? []
    state.availableProjects = payload.data.availableProjects ?? []
    state.loading = false
  }
})
