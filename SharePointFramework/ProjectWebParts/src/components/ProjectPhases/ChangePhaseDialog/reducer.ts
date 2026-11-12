import { createAction, createReducer, current } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import { ChecklistItemModel } from 'pp365-shared-library'
import { isEmpty } from 'underscore'
import { IProjectPhasesContext } from '../context'
import { View } from './Views'
import { IArchiveConfiguration } from './Views/ArchiveView'
import { getNextIndex } from './getNextIndex'
import { IChangePhaseDialogState } from './types'
import { useMemo, useReducer } from 'react'

/** Starts a fresh dialog from the phase selector's current data. */
export const INIT = createAction<{ context: IProjectPhasesContext }>('INIT')
/** Moves to another phase-change step. */
export const SET_VIEW = createAction<{ view: View }>('SET_VIEW')
/** Applies a saved checkpoint and advances to the next open one or summary. */
export const CHECKLIST_ITEM_UPDATED = createAction<{
  properties: Partial<Record<string, any>>
}>('CHECKLIST_ITEM_UPDATED')
/** Stores documents and lists selected for archiving. */
export const SET_ARCHIVE_CONFIGURATION = createAction<{
  archiveConfiguration: IArchiveConfiguration
}>('SET_ARCHIVE_CONFIGURATION')

const createChangePhaseDialogReducer = () =>
  createReducer<IChangePhaseDialogState>({}, (builder) =>
    builder
      .addCase(INIT, (_state, { payload }) => {
        // A new state, so nothing of an earlier opening (a skipped checklist, an archive choice)
        // is left.
        const phase =
          payload.context.state.phase ||
          payload.context.state.data.phases.find((phase) => phase.properties.IsInitial)
        const checklistItems: ChecklistItemModel[] = phase?.checklistData?.items ?? []
        if (isEmpty(checklistItems)) {
          return { view: payload.context.props.useArchive ? View.Archive : View.Confirm }
        }
        const openChecklistItems = checklistItems.filter(
          (item) => item.status === strings.StatusOpen
        )
        return {
          view: isEmpty(openChecklistItems) ? View.Summary : View.Initial,
          // A copy: immer freezes what the state holds, and the loaded phase keeps its own list.
          checklistItems: [...checklistItems],
          currentIdx: getNextIndex(checklistItems),
          isChecklistMandatory: phase.isChecklistMandatory === 'true'
        }
      })
      .addCase(SET_VIEW, (state, { payload }) => {
        state.view = payload.view
      })
      .addCase(CHECKLIST_ITEM_UPDATED, (state, { payload }) => {
        const checklistItems = current(state).checklistItems as ChecklistItemModel[]
        const item = checklistItems[state.currentIdx]
        state.checklistItems[state.currentIdx] = item.update(payload.properties)
        const nextIndex = getNextIndex(checklistItems, state.currentIdx + 1)
        if (nextIndex !== -1) {
          state.currentIdx = nextIndex
        } else {
          state.view = View.Summary
        }
      })
      .addCase(SET_ARCHIVE_CONFIGURATION, (state, { payload }) => {
        state.archiveConfiguration = payload.archiveConfiguration
      })
  )

/**
 * Starts fresh checkpoint and archive state each time the phase-change dialog mounts.
 */
export const useChangePhaseDialogReducer = (context?: IProjectPhasesContext) => {
  const reducer = useMemo(() => createChangePhaseDialogReducer(), [])
  const [state, dispatch] = useReducer(reducer, {}, (initialState: IChangePhaseDialogState) =>
    context ? reducer(initialState, INIT({ context })) : initialState
  )
  return { state, dispatch }
}
