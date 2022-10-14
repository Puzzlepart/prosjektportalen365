/* eslint-disable @typescript-eslint/no-empty-function */
import {
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
  ConstrainMode,
  DialogFooter,
  ActionButton
} from '@fluentui/react'
import { InfoMessage } from 'components/InfoMessage'
import { SPDataAdapter } from 'data'
import { SPFolder } from 'models'
import * as strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent, useContext, useEffect, useState } from 'react'
import { TemplateSelectorContext } from 'templateSelector/context'
import { isEmpty } from 'underscore'
import { DocumentTemplateDialogScreen } from '..'
import { DocumentTemplateDialogContext } from '../context'
import { FolderNavigation } from '../FolderNavigation'
import { SET_SCREEN, SET_TARGET } from '../reducer'
import columns from './columns'
import styles from './TargetFolderScreen.module.scss'

export const TargetFolderScreen: FunctionComponent = () => {
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const context = useContext(TemplateSelectorContext)
  const [root, setRoot] = useState(context.currentLibrary)
  const [folders, setFolders] = useState(root.folders)
  const [folder, setFolder] = useState(state.targetFolder)

  useEffect(() => {
    if (folder === null) {
      setFolders(context.libraries)
    } else if (isEmpty(folder)) {
      setFolders(root.folders)
    } else SPDataAdapter.getFolders(folder).then(setFolders)
  }, [folder])

  return (
    <div className={styles.root}>
      <InfoMessage text={strings.DocumentTemplateDialogScreenTargetFolderInfoText} />
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
      <DetailsList
        items={folders.sort((a, b) => (a.name > b.name ? 1 : -1))}
        columns={columns()}
        selectionMode={SelectionMode.none}
        layoutMode={DetailsListLayoutMode.justified}
        constrainMode={ConstrainMode.horizontalConstrained}
        onItemInvoked={(folder: SPFolder) => {
          if (folder.isLibrary) setRoot(folder)
          setFolder(folder.url)
        }}
      />
      <DialogFooter>
        <ActionButton
          text={strings.OnGoBackText}
          iconProps={{ iconName: 'NavigateBack' }}
          onClick={() => dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select }))}
        />
        <ActionButton
          text={strings.CopyHereText}
          iconProps={{ iconName: 'Copy' }}
          disabled={folder === null}
          onClick={() => {
            dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
            dispatch(SET_TARGET({ folder: folder || root.url }))
          }}
        />
      </DialogFooter>
    </div>
  )
}
