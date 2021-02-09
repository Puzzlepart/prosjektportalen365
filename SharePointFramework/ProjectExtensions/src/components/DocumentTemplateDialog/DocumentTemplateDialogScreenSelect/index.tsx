/* eslint-disable @typescript-eslint/no-empty-function */
import { TemplateItem } from 'models'
import { Breadcrumb, IBreadcrumbItem } from 'office-ui-fabric-react/lib/Breadcrumb'
import {
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode
} from 'office-ui-fabric-react/lib/DetailsList'
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectExtensionsStrings'
import React, { useMemo, useState } from 'react'
import { isEmpty } from 'underscore'
import { InfoMessage } from '../../InfoMessage'
import columns from './columns'
import {
  IDocumentTemplateDialogScreenSelectProps
} from './types'

export const DocumentTemplateDialogScreenSelect = (props: IDocumentTemplateDialogScreenSelectProps) => {
  const [folder, setFolder] = useState<string>('')

  const folders = useMemo(() => folder.split('/').splice(4), [folder])
  const templates = useMemo(() => [...props.templates].filter((item) => {
    return !isEmpty(folder) ? folder === item.parentFolderUrl : item.level === 1
  }), [folder])

  const breadcrumb: IBreadcrumbItem[] = [
    { key: 'root', text: props.templateLibrary.title, onClick: () => setFolder('') },
    ...folders.map((f, idx) => {
      const isCurrentItem = folders.length - 1 === idx
      return {
        key: idx.toString(),
        text: f,
        isCurrentItem,
        onClick: !isCurrentItem && (() => {
          const delCount = (folders.length - (folders.length - 5 - idx))
          const _folder = folder.split('/').splice(0, delCount).join('/')
          setFolder(_folder)
        })
      }
    })
  ]

  return (
    <>
      <InfoMessage
        text={format(
          strings.DocumentTemplateDialogScreenSelectInfoText,
          props.templateLibrary.url,
          props.templateLibrary.title
        )}
      />
      <Breadcrumb
        items={breadcrumb}
        maxDisplayedItems={5} />
      <MarqueeSelection selection={props.selection}>
        <DetailsList
          setKey={folder}
          getKey={(item: TemplateItem) => item.id}
          items={templates}
          columns={columns({
            onNavigateFolder: ({ serverRelativeUrl }) => setFolder(serverRelativeUrl)
          })}
          selection={props.selection}
          selectionMode={SelectionMode.multiple}
          layoutMode={DetailsListLayoutMode.justified}
          constrainMode={ConstrainMode.horizontalConstrained}
          onItemInvoked={(item: TemplateItem) => {
            if (item.isFolder) {
              setFolder(item.serverRelativeUrl)
            }
          }}
        />
      </MarqueeSelection>
    </>
  )
}
