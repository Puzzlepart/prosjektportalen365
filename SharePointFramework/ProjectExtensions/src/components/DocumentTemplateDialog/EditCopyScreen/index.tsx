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
   * On input changed
   *
   * @param id Id
   * @param properties Updated properties
   * @param errorMessage Error message
   */
  function onInputChanged(id: string, properties: Record<string, string>, errorMessage?: string) {
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
