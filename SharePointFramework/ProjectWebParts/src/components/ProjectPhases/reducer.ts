
import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProjectPhaseCalloutProps } from './ProjectPhase/ProjectPhaseCallout'
import { IProjectPhasesData, IProjectPhasesState } from './types'

export const INIT_DATA = createAction<{ data: IProjectPhasesData }>(
    'INIT_DATA'
)
export const HIDE_MESSAGE = createAction(
    'HIDE_MESSAGE'
)
export const OPEN_CALLOUT = createAction<IProjectPhaseCalloutProps>(
    'OPEN_CALLOUT'
)
export const CHANGE_PHASE = createAction(
    'CHANGE_PHASE'
)
export const DISMISS_CALLOUT =createAction(
    'DISMISS_CALLOUT'
)

export const initState = (): IProjectPhasesState => ({
    isLoading: true
})

export default createReducer(initState(), {
    [INIT_DATA.type]: (state, { payload }: ReturnType<typeof INIT_DATA>) => {
        state.data = payload.data
        state.isLoading = false
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
    }
})

