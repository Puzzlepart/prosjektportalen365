import { MessageBarType } from '@fluentui/react'
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

export default createReducer(initialState, {
  [INIT_DATA.type]: (state, { payload }: ReturnType<typeof INIT_DATA>) => {
    if (payload.data) {
      state.data = payload.data
      state.phase = payload.data?.currentPhase
      state.isDataLoaded = true
    }
    state.error = payload.error && CustomError.createError(payload.error, MessageBarType.error)
  },

  [OPEN_POPOVER.type]: (state, { payload }) => {
    state.popover = payload
  },

  [DISMISS_POPOVER.type]: (state) => {
    state.popover = null
  },

  [DISMISS_CHANGE_PHASE_DIALOG.type]: (state) => {
    state.confirmPhase = null
  },

  [INIT_CHANGE_PHASE.type]: (state) => {
    state.isChangingPhase = true
  },

  [CHANGE_PHASE.type]: (state) => {
    state.confirmPhase = state.popover.phase
    state.popover = null
  },

  [SET_PHASE.type]: (state, { payload }: ReturnType<typeof SET_PHASE>) => {
    state.phase = payload.phase
    state.isChangingPhase = false
  },

  [CHANGE_PHASE_ERROR.type]: (state, { payload }: ReturnType<typeof CHANGE_PHASE_ERROR>) => {
    state.isChangingPhase = false
    state.error = payload.error && CustomError.createError(payload.error, MessageBarType.error)
  }
})
