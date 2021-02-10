import { FileAddResult } from '@pnp/sp'
import { createAction, createReducer } from '@reduxjs/toolkit'
import { TemplateItem } from 'models'
import { Selection } from 'office-ui-fabric-react/lib/DetailsList'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogState } from './types'

export const SELECTION_CHANGED = createAction<{ selection: Selection }>('SELECTION_CHANGED')
export const START_COPY = createAction('START_COPY')
export const COPY_PROGRESS = createAction<any>('COPY_PROGRESS')
export const COPY_DONE = createAction<{ files: FileAddResult[] }>('COPY_DONE')
export const SET_SCREEN = createAction<{ screen: DocumentTemplateDialogScreen }>('SET_SCREEN')

export const initState = (): IDocumentTemplateDialogState => ({
  screen: DocumentTemplateDialogScreen.Select,
  selected: []
})

export default createReducer(initState(), {
  [SELECTION_CHANGED.type]: (state, { payload }: ReturnType<typeof SELECTION_CHANGED>) => {
    state.selected = (payload.selection.getSelection() as TemplateItem[]).filter((item) => !item.isFolder)
  },

  [START_COPY.type]: (state) => {
    state.screen = DocumentTemplateDialogScreen.CopyProgress
    state.isBlocking = true
  },

  [COPY_PROGRESS.type]: (state, { payload }: ReturnType<typeof COPY_PROGRESS>) => {
    state.progress = payload
  },

  [COPY_DONE.type]: (state, { payload }: ReturnType<typeof COPY_DONE>) => {
    state.uploaded = payload.files
    state.screen = DocumentTemplateDialogScreen.Summary
    state.isBlocking = false
  },

  [SET_SCREEN.type]: (state, { payload }: ReturnType<typeof SET_SCREEN>) => {
    state.screen = payload.screen
  },
})
