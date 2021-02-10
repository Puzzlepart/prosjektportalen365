/* eslint-disable @typescript-eslint/no-empty-function */
import { SPDataAdapter } from 'data'
import { SPFolder } from 'models'
import { ConstrainMode, DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import React, { useContext, useEffect, useState } from 'react'
import { TemplateSelectorContext } from 'templateSelector/context'
import { first, isEmpty } from 'underscore'
import { FolderNavigation } from '../FolderNavigation'
import columns from './columns'
import styles from './TargetFolderScreen.module.scss'

export const TargetFolderScreen = () => {
  const context = useContext(TemplateSelectorContext)
  const library = first(context.libraries)
  const [folders, setFolders] = useState(library.folders)
  const [folder, setFolder] = useState('')

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
    </div>
  )
}
