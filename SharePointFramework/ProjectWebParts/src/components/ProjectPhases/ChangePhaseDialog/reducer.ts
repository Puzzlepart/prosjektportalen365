import { createAction, createReducer, current } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import { ChecklistItemModel } from 'pp365-shared-library'
import { isEmpty } from 'underscore'
import { IProjectPhasesContext } from '../context'
import { View } from './Views'
import { IArchiveConfiguration } from './Views/ArchiveView'
import { getNextIndex } from './getNextIndex'
import { IChangePhaseDialogState } from './types'
import { useReducer } from 'react'

export const INIT = createAction<{ context: IProjectPhasesContext }>('INIT')
export const SET_VIEW = createAction<{ view: View }>('SET_VIEW')
export const CHECKLIST_ITEM_UPDATED = createAction<{
  properties: Partial<Record<string, any>>
}>('CHECKLIST_ITEM_UPDATED')
export const SET_ARCHIVE_CONFIGURATION = createAction<{
  archiveConfiguration: IArchiveConfiguration
}>('SET_ARCHIVE_CONFIGURATION')

const createChangePhaseDialogReducer = () =>
  createReducer<IChangePhaseDialogState>(
    {},
    {
      [INIT.type]: (state, { payload }: ReturnType<typeof INIT>) => {
        const phase =
          payload.context.state.phase ||
          payload.context.state.data.phases.find((phase) => phase.properties.IsInitial)

        if (phase) {
          const items = phase.checklistData.items ? Object.keys(phase.checklistData.items) : []
          if (!isEmpty(items)) {
            const checklistItems = phase.checklistData?.items || []
            const openChecklistItems = checklistItems.filter(
              (item: ChecklistItemModel) => item.status === strings.StatusOpen
            )
            state.view = isEmpty(openChecklistItems) ? View.Summary : View.Initial
            state.checklistItems = checklistItems
            state.currentIdx = getNextIndex(checklistItems)
            state.isChecklistMandatory = phase.isChecklistMandatory === 'true'
          } else {
            state.view = payload.context.props.useArchive ? View.Archive : View.Confirm
          }
        } else {
          state.view = payload.context.props.useArchive ? View.Archive : View.Confirm
        }
      },
      [SET_VIEW.type]: (state, { payload }: ReturnType<typeof SET_VIEW>) => {
        state.view = payload.view
      },
      [CHECKLIST_ITEM_UPDATED.type]: (
        state,
        { payload }: ReturnType<typeof CHECKLIST_ITEM_UPDATED>
      ) => {
        const checklistItems = current(state).checklistItems as ChecklistItemModel[]
        const item = checklistItems[state.currentIdx]
        state.checklistItems[state.currentIdx] = item.update(payload.properties)
        const nextIndex = getNextIndex(checklistItems, state.currentIdx + 1)
        if (nextIndex !== -1) {
          state.currentIdx = nextIndex
        } else {
          state.view = View.Summary
        }
      },
      [SET_ARCHIVE_CONFIGURATION.type]: (
        state,
        { payload }: ReturnType<typeof SET_ARCHIVE_CONFIGURATION>
      ) => {
        state.archiveConfiguration = payload.archiveConfiguration
      }
    }
  )

/**
 * Custom hook that returns the state and dispatch function for the change phase dialog reducer.
 *
 * @returns An object containing the state and dispatch function.
 */
export const useChangePhaseDialogReducer = () => {
  const reducer = createChangePhaseDialogReducer()
  const [state, dispatch] = useReducer(reducer, {})
  return { state, dispatch }
}
