/* eslint-disable @typescript-eslint/no-empty-function */
import {
  format,
  MarqueeSelection,
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
  ConstrainMode
} from '@fluentui/react'
import { TemplateItem } from 'models'
import * as strings from 'ProjectExtensionsStrings'
import React, { useContext, useMemo, useState } from 'react'
import { TemplateSelectorContext } from '../../../templateSelector/context'
import { isEmpty } from 'underscore'
import { FolderNavigation } from '../FolderNavigation'
import columns from './columns'
import { ISelectScreenProps } from './types'
import { UserMessage } from 'pp365-shared-library'

export const SelectScreen = (props: ISelectScreenProps) => {
  const context = useContext(TemplateSelectorContext)
  const [folder, setFolder] = useState<string>('')
  const templates = useMemo(
    () =>
      context.templates
        .filter((item) => {
          return !isEmpty(folder) ? folder === item.parentFolderUrl : item.level === 1
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1)),
    [folder]
  )
  return (
    <>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenSelectInfoTitle}
        message={format(
          strings.DocumentTemplateDialogScreenSelectInfoMessage,
          context.templateLibrary.url,
          context.templateLibrary.title
        )}
      />
      <FolderNavigation
        root={context.templateLibrary.title}
        currentFolder={folder}
        setFolder={setFolder}
      />
      <MarqueeSelection selection={props.selection}>
        <DetailsList
          setKey={folder}
          getKey={(item: TemplateItem) => item.id}
          items={templates}
          columns={columns({
            setFolder: ({ serverRelativeUrl }) => setFolder(serverRelativeUrl)
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
