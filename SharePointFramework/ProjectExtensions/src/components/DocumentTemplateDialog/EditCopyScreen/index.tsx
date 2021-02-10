import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { ISPLibraryFolder } from 'data/SPDataAdapter/ISPLibraryFolder'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'
import * as strings from 'ProjectExtensionsStrings'
import React, { useContext, useState } from 'react'
import { TemplateSelectorContext } from 'templateSelector/context'
import { first } from 'underscore'
import { InfoMessage } from '../../InfoMessage'
import { DocumentTemplateDialogScreen } from '../types'
import { DocumentTemplateItem } from './DocumentTemplateItem'
import styles from './EditCopyScreen.module.scss'
import { IEditCopyScreenProps } from './types'

export const EditCopyScreen = (props: IEditCopyScreenProps) => {
  const context = useContext(TemplateSelectorContext)
  const [templates, setTemplates] = useState([...props.selectedTemplates])
  const [selectedLibrary, setLibrary] = useState<ISPLibraryFolder>(first(context.libraries))
  const [selectedFolder, setFolder] = useState<ISPLibraryFolder>(null)

  /**
   * On input changed
   *
   * @param {string} id Id
   * @param {Object} properties Updated properties
   * @param {string} errorMessage Error message
   */
  function onInputChanged(id: string, properties: TypedHash<string>, errorMessage?: string) {
    setTemplates(
      templates.map((t) => {
        if (t.id === id) {
          t.update(properties)
          t.errorMessage = errorMessage
        }
        return t
      })
    )
  }

  /**
   * Check if file names are valid
   */
  function isFileNamesValid(): boolean {
    return templates.filter((t) => !stringIsNullOrEmpty(t.errorMessage)).length === 0
  }

  /**
   * On library changed
   *
   * Sets library in state, and sets folder to null
   *
   * @param {IDropdownOption} option Option
   */
  function onLibraryChanged(option: IDropdownOption) {
    setLibrary(option.data)
    setFolder(null)
  }

  /**
   * On folder changed
   *
   * Sets folder in state
   *
   * @param {IDropdownOption} option Option
   */
  function onFolderChanged(option: IDropdownOption) {
    setFolder(option.data)
  }

  /**
   * On start copy
   */
  function onStartCopy() {
    const selectedFolderUrl = selectedFolder
      ? selectedFolder.ServerRelativeUrl
      : selectedLibrary.ServerRelativeUrl
    props.onStartCopy(templates, selectedFolderUrl)
  }

  return (
    <div className={styles.root}>
      <InfoMessage text={strings.DocumentTemplateDialogScreenEditCopyInfoText} />
      {props.selectedTemplates.map((item, idx) => (
        <DocumentTemplateItem
          key={idx}
          item={item}
          folderServerRelativeUrl={
            selectedFolder ? selectedFolder.ServerRelativeUrl : selectedLibrary.ServerRelativeUrl
          }
          onInputChanged={onInputChanged}
        />
      ))}
      <div>
        <Dropdown
          disabled={context.libraries.length === 1}
          label={strings.DocumentLibraryDropdownLabel}
          defaultSelectedKey={selectedLibrary.Id}
          onChange={(_, option) => onLibraryChanged(option)}
          options={context.libraries.map((lib) => ({ key: lib.Id, text: lib.Title, data: lib }))}
        />
      </div>
      <div>
        <Dropdown
          disabled={selectedLibrary.Folders.length < 1}
          label={strings.FolderDropdownLabel}
          defaultSelectedKey={selectedFolder ? selectedFolder.Id : '-'}
          options={[
            {
              key: '-',
              text: strings.DocumentTemplateDialogScreenEditCopyRootLevelText,
              data: null
            },
            ...selectedLibrary.Folders.map((fld) => ({
              key: fld.Id,
              text: fld.Title,
              data: fld
            }))
          ]}
          onChange={(_, option) => onFolderChanged(option)}
        />
      </div>
      <DialogFooter>
        <ActionButton
          text={strings.OnGoBackText}
          iconProps={{ iconName: 'NavigateBack' }}
          onClick={() => props.onChangeScreen(DocumentTemplateDialogScreen.Select)}
        />
        <ActionButton
          text={strings.OnStartCopyText}
          iconProps={{ iconName: 'Copy' }}
          disabled={!isFileNamesValid()}
          onClick={onStartCopy}
        />
      </DialogFooter>
    </div>
  )
}
