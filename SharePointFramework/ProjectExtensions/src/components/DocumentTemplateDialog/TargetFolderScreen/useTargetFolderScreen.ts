import { SPDataAdapter } from 'data'
import { SPFolder, createDataGridColumns } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TemplateSelectorContext } from '../../../extensions/templateSelector/context'
import { DocumentTemplateDialogContext } from '../context'
import { IFolderNavigationItem } from '../FolderNavigation'
import { BROWSE_FOLDER, OPEN_LIBRARY, SELECT_FOLDER, SHOW_LIBRARIES } from '../reducer'
import { useFolderFocus } from '../useFolderFocus'
import columns from './columns'

/**
 * Component logic hook for `TargetFolderScreen`: the folders of where the dialog is browsing
 * (the library's own, a folder's from SharePoint, or the site's libraries), sorted by name, and
 * the moves, which go to the dialog's state so its footer knows what «Kopier hit» means.
 */
export function useTargetFolderScreen() {
  const context = useContext(TemplateSelectorContext)
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const { browse } = state
  const [folders, setFolders] = useState<SPFolder[]>(() =>
    browse.libraries ? context.libraries : browse.folder ? [] : (browse.library?.folders ?? [])
  )

  useEffect(() => {
    if (browse.libraries) setFolders(context.libraries)
    else if (!browse.folder) setFolders(browse.library?.folders ?? [])
    else void SPDataAdapter.getFolders(browse.folder).then(setFolders)
  }, [browse.libraries, browse.folder, browse.library])

  const onFolderClick = useCallback(
    (folder: SPFolder) => {
      dispatch(
        folder.isLibrary ? OPEN_LIBRARY({ library: folder }) : BROWSE_FOLDER({ folder: folder.url })
      )
    },
    [dispatch]
  )

  // Built once: the column keys are generated, and a new set on every render would reset the
  // grid's column state.
  const grid = useMemo(
    () => createDataGridColumns<SPFolder>(columns({ onFolderClick })),
    [onFolderClick]
  )

  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => (a.name > b.name ? 1 : -1)),
    [folders]
  )
  const containerRef = useRef<HTMLDivElement>(null)
  useFolderFocus(browse.folder ?? '', containerRef)

  // The way to the list of libraries, when the site has more than one.
  const navigationItems: IFolderNavigationItem[] | undefined =
    context.libraries?.length > 1
      ? [{ key: '_', text: strings.Library, onClick: () => dispatch(SHOW_LIBRARIES()) }]
      : undefined

  return {
    containerRef,
    browse,
    folders: sortedFolders,
    columns: grid.columns,
    navigationItems,
    isEmptyFolder: folders.length === 0 && !browse.libraries,
    browseFolder: (folder: string) => dispatch(BROWSE_FOLDER({ folder })),
    onSelectionChange: (ids: Array<string | number>) =>
      dispatch(SELECT_FOLDER({ folder: ids[0] as string }))
  }
}
