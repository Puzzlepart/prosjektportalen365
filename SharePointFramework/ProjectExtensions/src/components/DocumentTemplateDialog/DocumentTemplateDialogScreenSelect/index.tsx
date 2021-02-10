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
import React, { useContext, useMemo, useState } from 'react'
import { TemplateSelectorContext } from 'templateSelector/context'
import { isEmpty } from 'underscore'
import { InfoMessage } from '../../InfoMessage'
import columns from './columns'
import { IDocumentTemplateDialogScreenSelectProps } from './types'

export const DocumentTemplateDialogScreenSelect = (props: IDocumentTemplateDialogScreenSelectProps) => {
  const context = useContext(TemplateSelectorContext)
  const [folder, setFolder] = useState<string>('')

  const paths = useMemo(() => folder.split('/').splice(4), [folder])
  const templates = useMemo(
    () =>
      [...context.templates]
        .filter((item) => {
          return !isEmpty(folder) ? folder === item.parentFolderUrl : item.level === 1
        })
        .sort((a, b) =>
          a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1
        ),
    [folder]
  )

  const breadcrumb: IBreadcrumbItem[] = [
    { key: 'root', text: context.templateLibrary.title, onClick: () => setFolder('') },
    ...paths.map((f, idx) => {
      const isCurrentItem = (paths.length - 1 === idx)
      return {
        key: idx.toString(),
        text: f,
        isCurrentItem,
        onClick:
          !isCurrentItem &&
          (() => {
            const delCount = paths.length - (paths.length - 5 - idx)
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
          context.templateLibrary.url,
          context.templateLibrary.title
        )}
      />
      <Breadcrumb items={breadcrumb} maxDisplayedItems={5} />
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
