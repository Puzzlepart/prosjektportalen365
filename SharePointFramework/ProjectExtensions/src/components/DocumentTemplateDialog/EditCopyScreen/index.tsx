import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import * as strings from 'ProjectExtensionsStrings'
import React, { useState } from 'react'
import { InfoMessage } from '../../InfoMessage'
import { SET_SCREEN } from '../reducer'
import { DocumentTemplateDialogScreen } from '../types'
import { DocumentTemplateItem } from './DocumentTemplateItem'
import styles from './EditCopyScreen.module.scss'
import { IEditCopyScreenProps } from './types'

export const EditCopyScreen = ({
  selectedTemplates,
  targetFolder,
  onStartCopy,
  dispatch
}: IEditCopyScreenProps) => {
  const [templates, setTemplates] = useState([...selectedTemplates])

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

  return (
    <div className={styles.root}>
      <InfoMessage text={strings.DocumentTemplateDialogScreenEditCopyInfoText} />
      {selectedTemplates.map((item, idx) => (
        <DocumentTemplateItem
          key={idx}
          item={item}
          folder={targetFolder}
          onInputChanged={onInputChanged}
        />
      ))}
      <DialogFooter>
        <ActionButton
          text={strings.OnGoBackText}
          iconProps={{ iconName: 'NavigateBack' }}
          onClick={() =>
            dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.TargetFolder }))
          }
        />
        <ActionButton
          text={strings.OnStartCopyText}
          iconProps={{ iconName: 'Copy' }}
          disabled={!isFileNamesValid()}
          onClick={() => onStartCopy(templates)}
        />
      </DialogFooter>
    </div>
  )
}
