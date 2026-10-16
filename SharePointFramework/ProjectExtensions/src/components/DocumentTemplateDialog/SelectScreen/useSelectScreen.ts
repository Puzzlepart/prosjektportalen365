import { TemplateItem } from 'models'
import { createDataGridColumns } from 'pp365-shared-library'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TemplateSelectorContext } from '../../../extensions/templateSelector/context'
import { DocumentTemplateDialogContext } from '../context'
import { SELECTION_CHANGED } from '../reducer'
import { useFolderFocus } from '../useFolderFocus'
import columns from './columns'

/**
 * Component logic hook for `SelectScreen`: the folder of the template library open, the
 * templates in it (folders first, each sorted by name), and the selection, which the dialog
 * keeps as the templates to copy.
 */
export function useSelectScreen() {
  const context = useContext(TemplateSelectorContext)
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const [folder, setFolder] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const templates = useMemo(
    () =>
      (context.templates ?? [])
        .filter((item) => (folder ? folder === item.parentFolderUrl : item.level === 1))
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1)),
    [context.templates, folder]
  )

  // Built once: the column keys are generated, and a new set on every render would reset the
  // grid's column state. The folder setter is a state setter, which is stable.
  const grid = useMemo(
    () =>
      createDataGridColumns<TemplateItem>(
        columns({ setFolder: ({ serverRelativeUrl }) => setFolder(serverRelativeUrl) })
      ),
    []
  )

  useFolderFocus(folder, containerRef)

  // Opening another folder starts the selection over, as the v8 list did when its key changed.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    dispatch(SELECTION_CHANGED({ selected: [] }))
  }, [folder])

  return {
    containerRef,
    templateLibrary: context.templateLibrary,
    folder,
    setFolder,
    templates,
    columns: grid.columns,
    selectedIds: state.selected.map((item) => item.id),
    onSelectionChange: (ids: Array<string | number>) =>
      dispatch(SELECTION_CHANGED({ selected: templates.filter((t) => ids.includes(t.id)) })),
    onRowDoubleClick: (item: TemplateItem) => {
      if (item.isFolder) setFolder(item.serverRelativeUrl)
    }
  }
}
