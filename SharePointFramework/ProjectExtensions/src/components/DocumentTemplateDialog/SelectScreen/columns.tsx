import { initializeFileTypeIcons } from '@uifabric/file-type-icons'
import { getId } from '@uifabric/utilities'
import { TemplateItem } from 'models'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Link } from 'office-ui-fabric-react/lib/Link'
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings'
import React from 'react'

initializeFileTypeIcons()

export default ({ setFolder }: { setFolder: (folder: TemplateItem) => void }) =>
  [
    {
      key: getId('icon'),
      fieldName: 'icon',
      name: null,
      minWidth: 20,
      maxWidth: 20,
      onRender: (item: TemplateItem) => <Icon {...item.getIconProps()} />
    },
    {
      key: getId('name'),
      fieldName: 'name',
      name: ProjectExtensionsStrings.NameLabel,
      minWidth: 200,
      onRender: (item: TemplateItem) => {
        if (item.isFolder) {
          return (
            <Link onClick={() => setFolder(item)}>
              <span style={{ marginLeft: 4 }}>{item.name}</span>
            </Link>
          )
        }
        return item.name
      }
    },
    {
      key: getId('description'),
      fieldName: 'description',
      name: ProjectExtensionsStrings.DescriptionLabel,
      minWidth: 200,
      isResizable: true
    },
    {
      key: getId('phase'),
      fieldName: 'phase',
      name: ProjectExtensionsStrings.PhaseLabel,
      minWidth: 100
    },
    {
      key: getId('modified'),
      fieldName: 'modified',
      name: ProjectExtensionsStrings.ModifiedLabel,
      minWidth: 150
    }
  ] as IColumn[]
