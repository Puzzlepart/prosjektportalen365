import { Button, DialogActions } from '@fluentui/react-components'
import { SPDataAdapter } from 'data'
import { DataGridList, SPFolder, UserMessage, createDataGridColumns } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useContext, useEffect, useMemo, useState } from 'react'
import { TemplateSelectorContext } from '../../../extensions/templateSelector/context'
import { isEmpty } from 'underscore'
import { DocumentTemplateDialogScreen } from '..'
import { DocumentTemplateDialogContext } from '../context'
import { FolderNavigation } from '../FolderNavigation'
import { SET_SCREEN, SET_TARGET } from '../reducer'
import columns from './columns'
import styles from './TargetFolderScreen.module.scss'

export const TargetFolderScreen: FC = () => {
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const context = useContext(TemplateSelectorContext)
  const [root, setRoot] = useState(context.currentLibrary)
  const [folders, setFolders] = useState(root.folders)
  const [folder, setFolder] = useState(state.targetFolder || context.currentFolderUrl || '')
  // A folder chosen by selecting its row, without entering it. Cleared when the view moves on.
  const [selectedFolder, setSelectedFolder] = useState<string>(null)

  function onFolderClick(clickedFolder: SPFolder) {
    if (clickedFolder.isLibrary) setRoot(clickedFolder)
    setSelectedFolder(null)
    setFolder(clickedFolder.url)
  }

  // Built once: the column keys are generated, and a new set on every render would reset the
  // grid's column state. The click handler only uses state setters, which are stable.
  const grid = useMemo(() => createDataGridColumns<SPFolder>(columns({ onFolderClick })), [])

  useEffect(() => {
    setSelectedFolder(null)
    if (folder === null) {
      setFolders(context.libraries)
    } else if (isEmpty(folder)) {
      setFolders(root.folders)
    } else void SPDataAdapter.getFolders(folder).then(setFolders)
  }, [folder])

  const sortedFolders = [...folders].sort((a, b) => (a.name > b.name ? 1 : -1))

  return (
    <div className={styles.root}>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenTargetFolderInfoTitle}
        text={strings.DocumentTemplateDialogScreenTargetFolderInfoMessage}
      />
      <FolderNavigation
        items={
          context.libraries.length > 1 && [
            {
              key: '_',
              text: strings.Library,
              onClick: () => setFolder(null)
            }
          ]
        }
        root={root.name}
        currentFolder={folder}
        setFolder={setFolder}
      />
      <div className={styles.folders}>
        {folders.length === 0 && folder !== null ? (
          <UserMessage text={strings.NoFoldersAvailableText} intent='info' />
        ) : (
          // Selecting a row picks that folder as the target; clicking its name enters it instead.
          <DataGridList<SPFolder>
            items={sortedFolders}
            columns={grid.columns}
            getRowId={(item) => item.url}
            selectionMode='single'
            selectedItems={selectedFolder ? [selectedFolder] : []}
            onSelectionChange={(ids) => setSelectedFolder((ids[0] as string) ?? null)}
          />
        )}
      </div>
      <DialogActions>
        <Button
          appearance='primary'
          disabled={folder === null}
          onClick={() => {
            dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
            dispatch(SET_TARGET({ folder: selectedFolder || folder || root.url }))
          }}
        >
          {strings.CopyHereText}
        </Button>
        <Button
          onClick={() => dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select }))}
        >
          {strings.OnGoBackText}
        </Button>
      </DialogActions>
    </div>
  )
}
