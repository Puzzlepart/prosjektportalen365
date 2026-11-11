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

export const INIT = createAction<{ context: IProjectPhasesContext }>('INIT')
export const SET_VIEW = createAction<{ view: View }>('SET_VIEW')
export const CHECKLIST_ITEM_UPDATED = createAction<{
  properties: Partial<Record<string, any>>
}>('CHECKLIST_ITEM_UPDATED')
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
 * Custom hook that returns the state and dispatch function for the change phase dialog reducer.
 * Given the phases' context, the state starts from it (`INIT`) as the dialog mounts, which it does
 * each time it opens.
 *
 * @param context Context of the phase selector
 *
 * @returns An object containing the state and dispatch function.
 */
export const useChangePhaseDialogReducer = (context?: IProjectPhasesContext) => {
  const reducer = useMemo(() => createChangePhaseDialogReducer(), [])
  const [state, dispatch] = useReducer(reducer, {}, (initialState: IChangePhaseDialogState) =>
    context ? reducer(initialState, INIT({ context })) : initialState
  )
  return { state, dispatch }
}
