import { IFileInfo } from '@pnp/sp/files'
import { createAction, createReducer } from '@reduxjs/toolkit'
import { TemplateItem } from 'models'
import { SPFolder } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { ITemplateSelectorContext } from '../../extensions/templateSelector/context'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogState } from './types'

export const SELECTION_CHANGED = createAction<{ selected: TemplateItem[] }>('SELECTION_CHANGED')
export const START_COPY = createAction('START_COPY')
export const COPY_PROGRESS = createAction<any>('COPY_PROGRESS')
export const COPY_DONE = createAction<{ files: IFileInfo[] }>('COPY_DONE')
export const SET_SCREEN = createAction<{ screen: DocumentTemplateDialogScreen }>('SET_SCREEN')
export const SET_TARGET = createAction<{ folder: string }>('SET_TARGET')
/** Lists a library's folders: its row clicked on the target folder screen. */
export const OPEN_LIBRARY = createAction<{ library: SPFolder }>('OPEN_LIBRARY')
/** Opens a folder of the library browsed: its URL, or an empty string for the library's root. */
export const BROWSE_FOLDER = createAction<{ folder: string }>('BROWSE_FOLDER')
/** Lists the site's libraries instead of the library's folders. */
export const SHOW_LIBRARIES = createAction('SHOW_LIBRARIES')
/** Picks a folder by its row without entering it, or, with no folder, clears the pick. */
export const SELECT_FOLDER = createAction<{ folder: string }>('SELECT_FOLDER')
/** A copy's name or title edited, with what SharePoint said about the name. */
export const TEMPLATE_CHANGED = createAction<{
  id: string
  properties: Record<string, string>
  errorMessage?: string
}>('TEMPLATE_CHANGED')

/**
 * The state before anything happened: the select screen, and the target folder screen in the
 * library the command was run in, at the folder it was run in.
 *
 * @param context Where the command was run, when the dialog has it
 */
export const initState = (
  context?: Pick<ITemplateSelectorContext, 'currentLibrary' | 'currentFolderUrl'>
): IDocumentTemplateDialogState => ({
  targetFolder: '',
  screen: DocumentTemplateDialogScreen.Select,
  selected: [],
  uploaded: [],
  browse: {
    library: context?.currentLibrary,
    folder: context?.currentFolderUrl ?? '',
    libraries: false
  }
})

/**
 * What the duplicate check reads off a copy; the reducer's drafts of the model have these too.
 */
type NamedCopy = Pick<TemplateItem, 'id' | 'newName' | 'isFolder'>

/**
 * The error for a copy whose new name another copy has already, worded for a folder or a file,
 * or nothing when the name is its own.
 */
function duplicateNameError(templates: NamedCopy[], template: NamedCopy): string | undefined {
  const duplicate = templates.some(
    (other) =>
      other.id !== template.id && other.newName.toLowerCase() === template.newName.toLowerCase()
  )
  if (!duplicate) return undefined
  return template.isFolder
    ? strings.FolderNameAlreadySelectedErrorText
    : strings.FilenameAlreadySelectedErrorText
}

/**
 * Whether an error is one of the two duplicate-name errors, which the reducer clears itself once
 * the names differ again.
 */
function isDuplicateNameError(errorMessage: string | undefined): boolean {
  return (
    errorMessage === strings.FolderNameAlreadySelectedErrorText ||
    errorMessage === strings.FilenameAlreadySelectedErrorText
  )
}

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
    .addCase(OPEN_LIBRARY, (state, { payload }) => {
      state.browse.library = payload.library
      state.browse.folder = payload.library.url
      state.browse.libraries = false
      state.browse.selectedFolder = undefined
    })
    .addCase(BROWSE_FOLDER, (state, { payload }) => {
      state.browse.folder = payload.folder
      state.browse.libraries = false
      state.browse.selectedFolder = undefined
    })
    .addCase(SHOW_LIBRARIES, (state) => {
      state.browse.libraries = true
      state.browse.selectedFolder = undefined
    })
    .addCase(SELECT_FOLDER, (state, { payload }) => {
      state.browse.selectedFolder = payload.folder
    })
    .addCase(TEMPLATE_CHANGED, (state, { payload }) => {
      const templates = state.selected
      const changed = templates.find((template) => template.id === payload.id)
      if (!changed) return
      changed.update(payload.properties)
      if (payload.properties.newName) {
        // A new name is checked against the other copies first, then against what SharePoint
        // said; the others' duplicate errors follow the names as they change.
        for (const template of templates) {
          const duplicate = duplicateNameError(templates, template)
          if (template.id === payload.id) template.errorMessage = duplicate || payload.errorMessage
          else if (duplicate) template.errorMessage = duplicate
          else if (isDuplicateNameError(template.errorMessage)) template.errorMessage = undefined
        }
      } else if (payload.errorMessage !== undefined) {
        changed.errorMessage = payload.errorMessage
      }
      // The copies are model instances, which the reducer's drafts leave alone, so a new array
      // is what tells React the list changed.
      state.selected = [...templates]
    })
)
