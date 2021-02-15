import { createAction, createReducer } from '@reduxjs/toolkit'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { IProjectPhaseCalloutProps } from './ProjectPhase/ProjectPhaseCallout'
import { IProjectPhasesData, IProjectPhasesState } from './types'

export const INIT_DATA = createAction<{ data: IProjectPhasesData }>('INIT_DATA')
export const HIDE_MESSAGE = createAction('HIDE_MESSAGE')
export const OPEN_CALLOUT = createAction<IProjectPhaseCalloutProps>('OPEN_CALLOUT')
export const CHANGE_PHASE = createAction('CHANGE_PHASE')
export const DISMISS_CALLOUT = createAction('DISMISS_CALLOUT')
export const DISMISS_CHANGE_PHASE_DIALOG = createAction('DISMISS_CHANGE_PHASE_DIALOG')
export const INIT_CHANGE_PHASE = createAction('INIT_CHANGE_PHASE')
export const SET_PHASE = createAction<{ phase: ProjectPhaseModel }>('SET_PHASE')

export const initState = (): IProjectPhasesState => ({
  loading: true,
  data: {
    phases: []
  }
})

export default createReducer(initState(), {
  [INIT_DATA.type]: (state, { payload }: ReturnType<typeof INIT_DATA>) => {
    state.data = payload.data
    state.phase = payload.data.currentPhase
    state.loading = false
  },

  [HIDE_MESSAGE.type]: (state) => {
    state.hidden = true
  },

  [OPEN_CALLOUT.type]: (state, { payload }) => {
    state.callout = payload
  },

  [CHANGE_PHASE.type]: (state) => {
    state.confirmPhase = state.callout.phase
    state.callout = null
  },

  [DISMISS_CALLOUT.type]: (state) => {
    state.callout = null
  },

  [DISMISS_CHANGE_PHASE_DIALOG.type]: (state) => {
    state.confirmPhase = null
  },

  [INIT_CHANGE_PHASE.type]: (state) => {
    state.isChangingPhase = true
  },

  [SET_PHASE.type]: (state, { payload }: ReturnType<typeof SET_PHASE>) => {
    state.phase = payload.phase
    state.isChangingPhase = false
  }
})
