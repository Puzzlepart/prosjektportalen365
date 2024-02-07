import { Icon, Link, IColumn } from '@fluentui/react'
import {
  FileIconType,
  getFileTypeIconProps,
  initializeFileTypeIcons
} from '@uifabric/file-type-icons'
import { getId } from '@uifabric/utilities'
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings'
import { SPFolder } from 'pp365-shared-library'
import React from 'react'

initializeFileTypeIcons()

export default () =>
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
          <Link>
            <span style={{ marginLeft: 4 }}>{folder.name}</span>
          </Link>
        )
      }
    }
  ] as IColumn[]
