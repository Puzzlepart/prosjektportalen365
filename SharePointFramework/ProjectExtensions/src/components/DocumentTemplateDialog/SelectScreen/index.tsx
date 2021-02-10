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
import { getNav } from './nav'
import { ISelectScreenProps } from './types'

export const SelectScreen = (props: ISelectScreenProps) => {
  const context = useContext(TemplateSelectorContext)
  const [folder, setFolder] = useState<string>('')
  const nav = useMemo(() => getNav({ folder, setFolder }), [folder])
  const templates = useMemo(
    () =>
      [...context.templates]
        .filter((item) => {
          return !isEmpty(folder) ? folder === item.parentFolderUrl : item.level === 1
        })
        .sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1)),
    [folder]
  )

  const breadcrumb: IBreadcrumbItem[] = [
    {
      key: 'root',
      text: context.templateLibrary.title,
      onClick: () => setFolder(''),
      isCurrentItem: isEmpty(nav)
    },
    ...nav
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
