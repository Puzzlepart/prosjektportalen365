import { Link } from '@fluentui/react-components'
import { Icon, IColumn } from '@fluentui/react'
import {
  FileIconType,
  getFileTypeIconProps,
  initializeFileTypeIcons
} from '@fluentui/react-file-type-icons'
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings'
import { getId, SPFolder } from 'pp365-shared-library'
import React from 'react'

initializeFileTypeIcons()

export default ({ onFolderClick }: { onFolderClick: (folder: SPFolder) => void }) =>
  [
    {
      key: getId('icon'),
      fieldName: 'icon',
      name: null,
      minWidth: 20,
      maxWidth: 20,
      onRender: (folder: SPFolder) => (
        <Icon
          {...getFileTypeIconProps({
            type: folder.isLibrary ? FileIconType.list : FileIconType.folder
          })}
        />
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
  ] as IColumn[]
