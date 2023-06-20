import { createAction, createReducer } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import { isEmpty } from 'underscore'
import { IProjectPhasesContext } from '../context'
import { getNextIndex } from './getNextIndex'
import { IChangePhaseDialogState } from './types'
import { View } from './Views'

export const INIT = createAction<{ context: IProjectPhasesContext }>('INIT')
export const SET_VIEW = createAction<{ view: View }>('SET_VIEW')
export const CHECKLIST_ITEM_UPDATED = createAction<{
  properties: Partial<Record<string, any>>
}>('CHECKLIST_ITEM_UPDATED')

export default createReducer<IChangePhaseDialogState>(
  {},
  {
    [INIT.type]: (state, { payload }: ReturnType<typeof INIT>) => {
      if (payload.context.state.phase) {
        const items = Object.keys(
          payload.context.state.phase.checklistData.items
        )
        if (!isEmpty(items)) {
          const checklistItems =
            payload.context.state.phase.checklistData?.items || []
          const openCheclistItems = checklistItems.filter(
            (item) => item.status === strings.StatusOpen
          )
          state.view = isEmpty(openCheclistItems) ? View.Summary : View.Initial
          state.checklistItems = checklistItems
          state.currentIdx = getNextIndex(checklistItems)
        } else {
          state.view = View.Confirm
        }
      } else {
        state.view = View.Confirm
      }
    },

    [SET_VIEW.type]: (state, { payload }: ReturnType<typeof SET_VIEW>) => {
      state.view = payload.view
    },

    [CHECKLIST_ITEM_UPDATED.type]: (
      state,
      { payload }: ReturnType<typeof CHECKLIST_ITEM_UPDATED>
    ) => {
      const item = [...state.checklistItems][state.currentIdx]
      state.checklistItems[state.currentIdx] = {
        ...item,
        ...payload.properties
      }
      const nextIndex = getNextIndex(state.checklistItems, state.currentIdx + 1)
      if (nextIndex !== -1) state.currentIdx = nextIndex
      else state.view = View.Summary
    }
  }
)
