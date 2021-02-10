/* eslint-disable @typescript-eslint/no-empty-function */
import { SPDataAdapter } from 'data'
import { SPFolder } from 'models'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { ConstrainMode, DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import * as strings from 'ProjectExtensionsStrings'
import React, { useContext, useEffect, useState } from 'react'
import { TemplateSelectorContext } from 'templateSelector/context'
import { first, isEmpty } from 'underscore'
import { DocumentTemplateDialogScreen } from '..'
import { FolderNavigation } from '../FolderNavigation'
import { SET_SCREEN, SET_TARGET } from '../reducer'
import columns from './columns'
import styles from './TargetFolderScreen.module.scss'
import { ITargetFolderScreenProps } from './types'

export const TargetFolderScreen = ({ targetFolder, dispatch }: ITargetFolderScreenProps) => {
  const context = useContext(TemplateSelectorContext)
  const library = first(context.libraries)
  const [folders, setFolders] = useState(library.folders)
  const [folder, setFolder] = useState(targetFolder)

  useEffect(() => {
    if (isEmpty(folder)) {
      setFolders(library.folders)
    } else SPDataAdapter.getFolders(folder).then(setFolders)
  }, [folder])

  return (
    <div className={styles.root}>
      <FolderNavigation
        root={library.name}
        currentFolder={folder}
        setFolder={setFolder}
      />
      <DetailsList
        items={folders}
        columns={columns()}
        selectionMode={SelectionMode.multiple}
        layoutMode={DetailsListLayoutMode.justified}
        constrainMode={ConstrainMode.horizontalConstrained}
        onItemInvoked={(folder: SPFolder) => setFolder(folder.url)}
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
          onClick={() => {
            dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
            dispatch(SET_TARGET({ folder }))
          }}
        />
      </DialogFooter>
    </div>
  )
}
