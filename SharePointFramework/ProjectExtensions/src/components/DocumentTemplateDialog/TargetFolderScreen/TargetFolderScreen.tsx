import { DataGridList, SPFolder, UserMessage } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { FolderNavigation } from '../FolderNavigation'
import styles from './TargetFolderScreen.module.scss'
import { useTargetFolderScreen } from './useTargetFolderScreen'

/**
 * The screen where the user picks where the copies go: the library's folders, navigation into
 * them, and the other libraries when the site has several. Its buttons are the dialog's footer.
 */
export const TargetFolderScreen: FC = () => {
  const {
    browse,
    folders,
    columns,
    navigationItems,
    isEmptyFolder,
    browseFolder,
    onSelectionChange
  } = useTargetFolderScreen()
  return (
    <div className={styles.root}>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenTargetFolderInfoTitle}
        text={strings.DocumentTemplateDialogScreenTargetFolderInfoMessage}
      />
      <FolderNavigation
        items={navigationItems}
        root={browse.library?.name}
        currentFolder={browse.libraries ? undefined : browse.folder}
        setFolder={browseFolder}
      />
      <div className={styles.folders}>
        {isEmptyFolder ? (
          <UserMessage text={strings.NoFoldersAvailableText} intent='info' />
        ) : (
          // Selecting a row picks that folder as the target; clicking its name enters it instead.
          <DataGridList<SPFolder>
            items={folders}
            columns={columns}
            getRowId={(item) => item.url}
            selectionMode='single'
            selectedItems={browse.selectedFolder ? [browse.selectedFolder] : []}
            onSelectionChange={onSelectionChange}
          />
        )}
      </div>
    </div>
  )
}

TargetFolderScreen.displayName = 'TargetFolderScreen'
