import { Link } from '@fluentui/react-components'
import { FileIconType } from '@fluentui/react-file-type-icons'
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings'
import { FileTypeIcon, IListColumn, SPFolder, getId } from 'pp365-shared-library'
import React from 'react'

export default ({ onFolderClick }: { onFolderClick: (folder: SPFolder) => void }) =>
  [
    {
      key: getId('icon'),
      fieldName: 'icon',
      name: null,
      minWidth: 20,
      maxWidth: 20,
      onRender: (folder: SPFolder) => (
        <FileTypeIcon type={folder.isLibrary ? FileIconType.list : FileIconType.folder} />
      )
    },
    {
      key: getId('name'),
      fieldName: 'Title',
      name: ProjectExtensionsStrings.NameLabel,
      minWidth: 200,
      onRender: (folder: SPFolder) => {
        return (
          <Link onClick={() => onFolderClick(folder)}>
            <span style={{ marginLeft: 4 }}>{folder.name}</span>
          </Link>
        )
      }
    }
  ] as IListColumn[]
