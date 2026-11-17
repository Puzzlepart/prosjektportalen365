import { IFileInfo } from '@pnp/sp/files'
import { SPDataAdapter } from 'data'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useCallback, useContext, useEffect, useReducer, useRef } from 'react'
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

/** The screens that take the focus to the dialog's content as they open. */
const SCREENS_FOCUSING_CONTENT = [
  DocumentTemplateDialogScreen.EditCopy,
  DocumentTemplateDialogScreen.CopyProgress,
  DocumentTemplateDialogScreen.Summary
]

/** Coordinates wizard state, sequential template copying and footer navigation. */
export function useDocumentTemplateDialog(props: IDocumentTemplateDialogProps) {
  const selectorContext = useContext(TemplateSelectorContext)
  const [state, dispatch] = useReducer(reducer, selectorContext, initState)
  const telemetry = useTelemetry()
  const contentRef = useRef<HTMLDivElement>(null)

  // The names' screen, the copy and its summary replace the screen whose footer button had the
  // focus (WCAG 2.4.3): «Start kopiering» comes disabled while a name is checked, and the copy shows
  // no control, so the focus fell to the page, and then to «Lukk» as the summary drew it, just as
  // the summary was announced. A screen reader read «Lukk» and not the summary. The content takes
  // the focus, unless it has it already, and keeps it through the summary, which is then heard.
  useEffect(() => {
    if (!SCREENS_FOCUSING_CONTENT.includes(state.screen)) return
    const frame = requestAnimationFrame(() => {
      const content = contentRef.current
      if (content && !content.contains(document.activeElement)) content.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [state.screen])

  /**
   * Copies the templates picked, as named, to the target folder, one at a time with progress.
   * Usage statistics count the copy once, however many templates it took, and each template that
   * could not be copied by its error's code.
   */
  const onStartCopy = useCallback(async (): Promise<void> => {
    const templates = state.selected
    dispatch(START_COPY())
    const folder = SPDataAdapter.sp.web.getFolderByServerRelativePath(state.targetFolder)
    const filesAdded: IFileInfo[] = []
    let copied = 0
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
        copied++
        if (result) {
          filesAdded.push(result)
        }
      } catch (error) {
        // A template that cannot be copied is left out; the others are still copied.
        telemetry.trackError(error)
      }
    }
    // A copy of a folder without files adds no file and is a copy all the same, so the templates
    // that went through are what tells a copy from one where every template failed.
    if (copied > 0) telemetry.track('documentTemplates.copied')
    dispatch(SELECTION_CHANGED({ selected: [] }))
    dispatch(COPY_DONE({ files: filesAdded }))
  }, [state.selected, state.targetFolder, telemetry])

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
    contentRef,
    onStartCopy,
    goTo,
    copyHere,
    onClose,
    canSelect: state.selected.length > 0,
    canCopyHere: !state.browse.libraries,
    canStartCopy: state.selected.every((template) => !template.errorMessage)
  }
}
