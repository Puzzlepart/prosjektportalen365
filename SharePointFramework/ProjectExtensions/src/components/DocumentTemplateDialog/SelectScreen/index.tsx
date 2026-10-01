import { TemplateItem } from 'models'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TemplateSelectorContext } from '../../../extensions/templateSelector/context'
import { isEmpty } from 'underscore'
import { FolderNavigation } from '../FolderNavigation'
import columns from './columns'
import { DocumentTemplateDialogContext } from '../context'
import { SELECTION_CHANGED } from '../reducer'
import { DataGridList, UserMessage, createDataGridColumns, format } from 'pp365-shared-library'

export const SelectScreen: FC = () => {
  const context = useContext(TemplateSelectorContext)
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const [folder, setFolder] = useState<string>('')
  const templates = useMemo(
    () =>
      context.templates
        ?.filter((item) => {
          return !isEmpty(folder) ? folder === item.parentFolderUrl : item.level === 1
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1)),
    [folder]
  )

  // Built once: the column keys are generated, and a new set on every render would reset the
  // grid's column state. The folder setter is a state setter, which is stable.
  const grid = useMemo(
    () =>
      createDataGridColumns<TemplateItem>(
        columns({ setFolder: ({ serverRelativeUrl }) => setFolder(serverRelativeUrl) })
      ),
    []
  )

  // Opening another folder starts the selection over, as the v8 list did when its key changed.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    dispatch(SELECTION_CHANGED({ selected: [] }))
  }, [folder])

  return (
    <>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenSelectInfoTitle}
        text={format(
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
      <DataGridList<TemplateItem>
        items={templates}
        columns={grid.columns}
        getRowId={(item) => item.id}
        selectionMode='multiselect'
        selectedItems={state.selected.map((item) => item.id)}
        onSelectionChange={(ids) =>
          dispatch(SELECTION_CHANGED({ selected: templates.filter((t) => ids.includes(t.id)) }))
        }
        onRowDoubleClick={(item) => {
          if (item.isFolder) setFolder(item.serverRelativeUrl)
        }}
      />
    </>
  )
}
