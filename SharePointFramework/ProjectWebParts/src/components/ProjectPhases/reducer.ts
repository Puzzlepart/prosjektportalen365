import { createAction, createReducer } from '@reduxjs/toolkit'
import { ChecklistItemModel, CustomError, ProjectPhaseModel } from 'pp365-shared-library/lib/models'
import { IProjectPhasePopoverProps } from './ProjectPhase/ProjectPhasePopover'
import { IProjectPhasesData, IProjectPhasesState } from './types'

/** Initializes phase data or records its loading error. */
export const INIT_DATA = createAction<{ data: IProjectPhasesData; error?: Error }>('INIT_DATA')
/** Opens details for a phase. */
export const OPEN_POPOVER = createAction<IProjectPhasePopoverProps>('OPEN_POPOVER')
/** Moves the phase from the open popover into the confirmation dialog. */
export const CHANGE_PHASE = createAction('CHANGE_PHASE')
/** Closes phase details. */
export const DISMISS_POPOVER = createAction('DISMISS_POPOVER')
/** Cancels the pending phase change. */
export const DISMISS_CHANGE_PHASE_DIALOG = createAction('DISMISS_CHANGE_PHASE_DIALOG')
/** Marks the confirmed phase change as running. */
export const INIT_CHANGE_PHASE = createAction('INIT_CHANGE_PHASE')
/** Ends a failed phase change with an error. */
export const CHANGE_PHASE_ERROR = createAction<{ error: Error }>('CHANGE_PHASE_ERROR')
/** Applies the changed phase and clears earlier synchronization warnings. */
export const SET_PHASE = createAction<{ phase: ProjectPhaseModel }>('SET_PHASE')
/** Shows why the hub did not receive the phase change. */
export const HUB_SYNC_FAILED = createAction<{ warning: string }>('HUB_SYNC_FAILED')
/** Shows why the archive operation could not be logged. */
export const ARCHIVE_LOG_FAILED = createAction<{ warning: string }>('ARCHIVE_LOG_FAILED')
/** Updates loaded phase checklists after a checkpoint is saved. */
export const CHECKLIST_ITEM_SAVED = createAction<{ item: ChecklistItemModel }>(
  'CHECKLIST_ITEM_SAVED'
)
/** Phase selector state before its data loads. */
export const initialState: IProjectPhasesState = {
  isDataLoaded: false,
  data: {
    phases: []
  }
}

/**
 * `phase` with `item` in place of the checkpoint with its id, and the statuses counted again; or
 * `phase` itself when it does not hold the checkpoint. A copy, as immer does not draft the class.
 */
function withSavedChecklistItem(phase: ProjectPhaseModel, item: ChecklistItemModel) {
  const items = phase.checklistData?.items ?? []
  if (!items.some(({ id }) => id === item.id)) return phase
  const savedItems = items.map((existing) => (existing.id === item.id ? item : existing))
  const stats = savedItems.reduce<Record<string, number>>((counts, { status }) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
  return Object.assign(Object.create(Object.getPrototypeOf(phase)), phase, {
    checklistData: { items: savedItems, stats }
  }) as ProjectPhaseModel
}

/** Handles phase selection, checkpoint saves and phase-change feedback. */
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
      // A change the hub takes clears the warning an earlier one left; a failed one sets it again.
      state.hubSyncWarning = undefined
      state.archiveLogWarning = undefined
    })
    .addCase(CHECKLIST_ITEM_SAVED, (state, { payload }) => {
      // The change-phase dialog starts from the loaded checklist each time it opens, so a saved
      // checkpoint goes into it, and into the current phase, which is one of the phases. Read as
      // the plain state: immer's `Draft` drops `ProjectPhaseModel`'s private members, so a drafted
      // phase is not accepted where a phase is expected.
      const { data, phase } = state as unknown as IProjectPhasesState
      const phases = data.phases.map((p) => withSavedChecklistItem(p, payload.item))
      const saved = (p: ProjectPhaseModel) => p && (phases.find(({ id }) => id === p.id) ?? p)
      state.data.phases = phases
      state.data.currentPhase = saved(data.currentPhase)
      state.phase = saved(phase)
    })
    .addCase(HUB_SYNC_FAILED, (state, { payload }) => {
      state.hubSyncWarning = payload.warning
    })
    .addCase(ARCHIVE_LOG_FAILED, (state, { payload }) => {
      state.archiveLogWarning = payload.warning
    })
    .addCase(CHANGE_PHASE_ERROR, (state, { payload }) => {
      state.isChangingPhase = false
      state.error = payload.error && CustomError.createError(payload.error, 'error')
    })
)
