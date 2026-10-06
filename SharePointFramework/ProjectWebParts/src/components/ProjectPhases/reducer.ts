import { createAction, createReducer } from '@reduxjs/toolkit'
import { CustomError, ProjectPhaseModel } from 'pp365-shared-library/lib/models'
import { IProjectPhasePopoverProps } from './ProjectPhase/ProjectPhasePopover'
import { IProjectPhasesData, IProjectPhasesState } from './types'

export const INIT_DATA = createAction<{ data: IProjectPhasesData; error?: Error }>('INIT_DATA')
export const OPEN_POPOVER = createAction<IProjectPhasePopoverProps>('OPEN_POPOVER')
export const CHANGE_PHASE = createAction('CHANGE_PHASE')
export const DISMISS_POPOVER = createAction('DISMISS_POPOVER')
export const DISMISS_CHANGE_PHASE_DIALOG = createAction('DISMISS_CHANGE_PHASE_DIALOG')
export const INIT_CHANGE_PHASE = createAction('INIT_CHANGE_PHASE')
export const CHANGE_PHASE_ERROR = createAction<{ error: Error }>('CHANGE_PHASE_ERROR')
export const SET_PHASE = createAction<{ phase: ProjectPhaseModel }>('SET_PHASE')
export const initialState: IProjectPhasesState = {
  isDataLoaded: false,
  data: {
    phases: []
  }
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(INIT_DATA, (state, { payload }) => {
      if (payload.data) {
        state.data = payload.data
        state.phase = payload.data?.currentPhase
        state.isDataLoaded = true
      }
      state.error = payload.error && CustomError.createError(payload.error, 'error')
    })
    .addCase(OPEN_POPOVER, (state, { payload }) => {
      state.popover = payload
    })
    .addCase(DISMISS_POPOVER, (state) => {
      state.popover = null
    })
    .addCase(DISMISS_CHANGE_PHASE_DIALOG, (state) => {
      state.confirmPhase = null
    })
    .addCase(INIT_CHANGE_PHASE, (state) => {
      state.isChangingPhase = true
    })
    .addCase(CHANGE_PHASE, (state) => {
      state.confirmPhase = state.popover.phase
      state.popover = null
    })
    .addCase(SET_PHASE, (state, { payload }) => {
      state.phase = payload.phase
      state.isChangingPhase = false
    })
    .addCase(CHANGE_PHASE_ERROR, (state, { payload }) => {
      state.isChangingPhase = false
      state.error = payload.error && CustomError.createError(payload.error, 'error')
    })
)
