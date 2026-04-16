/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ConstrainMode,
  DefaultButton,
  DetailsList,
  DetailsListLayoutMode,
  DialogFooter,
  PrimaryButton,
  SelectionMode
} from '@fluentui/react'
import { SPDataAdapter } from 'data'
import { SPFolder, UserMessage } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useContext, useEffect, useState } from 'react'
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
  const [folder, setFolder] = useState(
    state.targetFolder || context.currentFolderUrl || ''
  )

  function onFolderClick(clickedFolder: SPFolder) {
    if (clickedFolder.isLibrary) setRoot(clickedFolder)
    setFolder(clickedFolder.url)
  }

  useEffect(() => {
    if (folder === null) {
      setFolders(context.libraries)
    } else if (isEmpty(folder)) {
      setFolders(root.folders)
    } else SPDataAdapter.getFolders(folder).then(setFolders)
  }, [folder])

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
      {folders.length === 0 && folder !== null ? (
        <UserMessage text={strings.NoFoldersAvailableText} intent='info' />
      ) : (
        <DetailsList
          items={folders.sort((a, b) => (a.name > b.name ? 1 : -1))}
          columns={columns({ onFolderClick })}
          selectionMode={SelectionMode.none}
          layoutMode={DetailsListLayoutMode.justified}
          constrainMode={ConstrainMode.horizontalConstrained}
          onItemInvoked={onFolderClick}
        />
      )}
      <DialogFooter>
        <PrimaryButton
          text={strings.CopyHereText}
          disabled={folder === null}
          onClick={() => {
            dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
            dispatch(SET_TARGET({ folder: folder || root.url }))
          }}
        />
        <DefaultButton
          text={strings.OnGoBackText}
          onClick={() => dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select }))}
        />
      </DialogFooter>
    </div>
  )
}
