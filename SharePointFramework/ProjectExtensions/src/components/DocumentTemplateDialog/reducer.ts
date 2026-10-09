import { createAction, createReducer } from '@reduxjs/toolkit'
import { TemplateItem } from 'models'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogState } from './types'
import { IFileInfo } from '@pnp/sp/files'

export const SELECTION_CHANGED = createAction<{ selected: TemplateItem[] }>('SELECTION_CHANGED')
export const START_COPY = createAction('START_COPY')
export const COPY_PROGRESS = createAction<any>('COPY_PROGRESS')
export const COPY_DONE = createAction<{ files: IFileInfo[] }>('COPY_DONE')
export const SET_SCREEN = createAction<{ screen: DocumentTemplateDialogScreen }>('SET_SCREEN')
export const SET_TARGET = createAction<{ folder: string }>('SET_TARGET')

export const initState = (): IDocumentTemplateDialogState => ({
  targetFolder: '',
  screen: DocumentTemplateDialogScreen.Select,
  selected: [],
  uploaded: []
})

export default createReducer(initState(), (builder) =>
  builder
    .addCase(SELECTION_CHANGED, (state, { payload }) => {
      state.selected = payload.selected
    })
    .addCase(START_COPY, (state) => {
      state.screen = DocumentTemplateDialogScreen.CopyProgress
      state.locked = true
    })
    .addCase(COPY_PROGRESS, (state, { payload }) => {
      state.progress = payload
    })
    .addCase(COPY_DONE, (state, { payload }) => {
      state.uploaded = payload.files
      state.screen = DocumentTemplateDialogScreen.Summary
      state.locked = false
      state.selected = []
    })
    .addCase(SET_SCREEN, (state, { payload }) => {
      state.screen = payload.screen
      if (state.screen === DocumentTemplateDialogScreen.Select) {
        state.selected = []
      }
    })
    .addCase(SET_TARGET, (state, { payload }) => {
      state.targetFolder = payload.folder
    })
)
