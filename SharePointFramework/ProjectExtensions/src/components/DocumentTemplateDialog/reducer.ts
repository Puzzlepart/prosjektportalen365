import { FileAddResult } from '@pnp/sp'
import { createAction, createReducer } from '@reduxjs/toolkit'
import { TemplateItem } from 'models'
import { Selection } from 'office-ui-fabric-react/lib/DetailsList'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogState } from './types'

/**
 * When selection is changed, the non-folder items is set in the state.
 */
export const SELECTION_CHANGED = createAction<{ selection: Selection }>('SELECTION_CHANGED')

/**
 * Start copying of items
 */
export const START_COPY = createAction('START_COPY')

/**
 * Updat copy progress
 */
export const COPY_PROGRESS = createAction<any>('COPY_PROGRESS')

/**
 * When copying is done
 */
export const COPY_DONE = createAction<{ files: FileAddResult[] }>('COPY_DONE')

/**
 * Set screen
 *
 * One of the following
 *
 * * Select
 * * TargetFolder
 * * EditCopy
 * * CopyProgress
 * * Summary
 *
 * When changing to Select screen, the selected state is reset.
 */
export const SET_SCREEN = createAction<{ screen: DocumentTemplateDialogScreen }>('SET_SCREEN')

/**
 * Set target folder
 */
export const SET_TARGET = createAction<{ folder: string }>('SET_TARGET')

export const initState = (): IDocumentTemplateDialogState => ({
  targetFolder: '',
  screen: DocumentTemplateDialogScreen.Select,
  selected: [],
  uploaded: []
})

export default createReducer(initState(), {
  [SELECTION_CHANGED.type]: (state, { payload }: ReturnType<typeof SELECTION_CHANGED>) => {
    state.selected = (payload.selection.getSelection() as TemplateItem[]).filter(
      (item) => !item.isFolder
    )
  },
  [START_COPY.type]: (state) => {
    state.screen = DocumentTemplateDialogScreen.CopyProgress
    state.locked = true
  },
  [COPY_PROGRESS.type]: (state, { payload }: ReturnType<typeof COPY_PROGRESS>) => {
    state.progress = payload
  },
  [COPY_DONE.type]: (state, { payload }: ReturnType<typeof COPY_DONE>) => {
    state.uploaded = payload.files
    state.screen = DocumentTemplateDialogScreen.Summary
    state.locked = false
    state.selected = []
  },
  [SET_SCREEN.type]: (state, { payload }: ReturnType<typeof SET_SCREEN>) => {
    state.screen = payload.screen
    if (state.screen === DocumentTemplateDialogScreen.Select) {
      state.selected = []
    }
  },
  [SET_TARGET.type]: (state, { payload }: ReturnType<typeof SET_TARGET>) => {
    state.targetFolder = payload.folder
  }
})
