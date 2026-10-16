import { TemplateItem } from 'models'
import { DataGridList, UserMessage, format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { FolderNavigation } from '../FolderNavigation'
import { useSelectScreen } from './useSelectScreen'

/**
 * The screen where the user picks templates from the template library, folder by folder.
 */
export const SelectScreen: FC = () => {
  const {
    containerRef,
    templateLibrary,
    folder,
    setFolder,
    templates,
    columns,
    selectedIds,
    onSelectionChange,
    onRowDoubleClick
  } = useSelectScreen()
  return (
    <div ref={containerRef}>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenSelectInfoTitle}
        text={format(
          strings.DocumentTemplateDialogScreenSelectInfoMessage,
          templateLibrary.url,
          templateLibrary.title
        )}
      />
      <FolderNavigation root={templateLibrary.title} currentFolder={folder} setFolder={setFolder} />
      <DataGridList<TemplateItem>
        items={templates}
        columns={columns}
        getRowId={(item) => item.id}
        selectionMode='multiselect'
        selectedItems={selectedIds}
        onSelectionChange={onSelectionChange}
        onRowDoubleClick={onRowDoubleClick}
      />
    </div>
  )
}

SelectScreen.displayName = 'SelectScreen'
