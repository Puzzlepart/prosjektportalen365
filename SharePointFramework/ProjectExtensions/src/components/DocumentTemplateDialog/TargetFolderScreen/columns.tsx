import {
  FileIconType,
  getFileTypeIconProps,
  initializeFileTypeIcons
} from '@uifabric/file-type-icons'
import { getId } from '@uifabric/utilities'
import { SPFolder } from 'models'
import { IColumn } from '@fluentui/react/lib/DetailsList'
import { Icon } from '@fluentui/react/lib/Icon'
import { Link } from '@fluentui/react/lib/Link'
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings'
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
