import { IFileInfo } from '@pnp/sp/files'
import { SPDataAdapter } from 'data'
import { useCallback, useContext, useReducer } from 'react'
import { TemplateSelectorContext } from '../../extensions/templateSelector/context'
import reducer, {
  COPY_DONE,
  COPY_PROGRESS,
  SELECTION_CHANGED,
  SET_SCREEN,
  SET_TARGET,
  START_COPY,
  initState
} from './reducer'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogProps } from './types'

/**
 * Component logic hook for `DocumentTemplateDialog`: the dialog's state, the copy, and the
 * footer's choices, which the dialog owns so every screen's buttons sit in the same place.
 *
 * @param props The dialog's props
 */
export function useDocumentTemplateDialog(props: IDocumentTemplateDialogProps) {
  const selectorContext = useContext(TemplateSelectorContext)
  const [state, dispatch] = useReducer(reducer, selectorContext, initState)

  /**
   * Copies the templates picked, as named, to the target folder, one at a time with progress.
   */
  const onStartCopy = useCallback(async (): Promise<void> => {
    const templates = state.selected
    dispatch(START_COPY())
    const folder = SPDataAdapter.sp.web.getFolderByServerRelativePath(state.targetFolder)
    const filesAdded: IFileInfo[] = []
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      dispatch(
        COPY_PROGRESS({
          description: template.newName,
          percentComplete: i / templates.length,
          iconOptions: template.getFileTypeIconOptions({ size: 48 })
        })
      )
      try {
        const result = await template.copyTo(folder)
        if (result) {
          filesAdded.push(result)
        }
      } catch {
        // A template that cannot be copied is left out; the others are still copied.
      }
    }
    dispatch(SELECTION_CHANGED({ selected: [] }))
    dispatch(COPY_DONE({ files: filesAdded }))
  }, [state.selected, state.targetFolder])

  const goTo = useCallback(
    (screen: DocumentTemplateDialogScreen) => dispatch(SET_SCREEN({ screen })),
    []
  )

  /**
   * Takes the folder picked by its row, else the folder open, else the library's root, as the
   * target, and moves on to naming the copies.
   */
  const copyHere = useCallback(() => {
    const { browse } = state
    dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
    dispatch(SET_TARGET({ folder: browse.selectedFolder || browse.folder || browse.library?.url }))
  }, [state.browse])

  const onClose = useCallback(
    () => props.onDismiss({ reload: state.screen === DocumentTemplateDialogScreen.Summary }),
    [props.onDismiss, state.screen]
  )

  return {
    state,
    dispatch,
    onStartCopy,
    goTo,
    copyHere,
    onClose,
    canSelect: state.selected.length > 0,
    canCopyHere: !state.browse.libraries,
    canStartCopy: state.selected.every((template) => !template.errorMessage)
  }
}
