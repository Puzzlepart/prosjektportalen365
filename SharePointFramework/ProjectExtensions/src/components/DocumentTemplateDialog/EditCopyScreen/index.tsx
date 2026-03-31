import { DefaultButton, DialogFooter, PrimaryButton } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useContext, useState } from 'react'
import { DocumentTemplateDialogContext } from '../context'
import { SET_SCREEN } from '../reducer'
import { DocumentTemplateDialogScreen } from '../types'
import { DocumentTemplateItem } from './DocumentTemplateItem'
import styles from './EditCopyScreen.module.scss'
import { IEditCopyScreenProps } from './types'
import { UserMessage } from 'pp365-shared-library'

export const EditCopyScreen: FC<IEditCopyScreenProps> = ({ onStartCopy }) => {
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const [templates, setTemplates] = useState([...state.selected])

  /**
   * Check for duplicate names across all templates
   *
   * @param newName Name to check
   * @param currentId ID of current item
   * @param isFolder Whether it's a folder
   */
  function checkForDuplicates(newName: string, currentId: string, isFolder: boolean): string {
    const duplicate = templates.find(
      (t) => t.id !== currentId && t.newName.toLowerCase() === newName.toLowerCase()
    )
    if (duplicate) {
      return isFolder
        ? strings.FolderNameAlreadySelectedErrorText
        : strings.FilenameAlreadySelectedErrorText
    }
    return null
  }

  /**
   * On input changed
   *
   * @param id Id
   * @param properties Updated properties
   * @param errorMessage Error message from SharePoint validation
   */
  function onInputChanged(id: string, properties: Record<string, string>, errorMessage?: string) {
    const updatedTemplates = templates.map((t) => {
      if (t.id === id) {
        t.update(properties)
        if (properties.newName) {
          const duplicateError = checkForDuplicates(properties.newName, id, t.isFolder)
          t.errorMessage = duplicateError || errorMessage
        } else if (errorMessage !== undefined) {
          t.errorMessage = errorMessage
        }
      }
      return t
    })

    if (properties.newName) {
      updatedTemplates.forEach((t) => {
        const duplicateError = checkForDuplicates(t.newName, t.id, t.isFolder)
        if (duplicateError) {
          t.errorMessage = duplicateError
        } else if (
          t.id !== id &&
          (t.errorMessage === strings.FilenameAlreadySelectedErrorText ||
            t.errorMessage === strings.FolderNameAlreadySelectedErrorText)
        ) {
          t.errorMessage = null
        }
      })
    }

    setTemplates([...updatedTemplates])
  }

  /**
   * Check if file names are valid
   */
  function isFileNamesValid(): boolean {
    return templates.filter((t) => !stringIsNullOrEmpty(t.errorMessage)).length === 0
  }

  return (
    <div className={styles.root}>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenEditCopyInfoTitle}
        text={strings.DocumentTemplateDialogScreenEditCopyInfoMessage}
      />
      {state.selected.map((item, idx) => (
        <DocumentTemplateItem key={idx} item={item} onInputChanged={onInputChanged} />
      ))}
      <DialogFooter>
        <PrimaryButton
          text={strings.OnStartCopyText}
          disabled={!isFileNamesValid()}
          onClick={() => onStartCopy(templates)}
        />
        <DefaultButton
          text={strings.OnGoBackText}
          onClick={() =>
            dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.TargetFolder }))
          }
        />
      </DialogFooter>
    </div>
  )
}
