import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import * as strings from 'ProjectExtensionsStrings'
import React, { useContext, useState } from 'react'
import { InfoMessage } from '../../InfoMessage'
import { DocumentTemplateDialogContext } from '../context'
import { SET_SCREEN } from '../reducer'
import { DocumentTemplateDialogScreen } from '../types'
import { DocumentTemplateItem } from './DocumentTemplateItem'
import styles from './EditCopyScreen.module.scss'
import { IEditCopyScreenProps } from './types'

export const EditCopyScreen = ({ onStartCopy }: IEditCopyScreenProps) => {
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const [templates, setTemplates] = useState([...state.selected])

  /**
   * On input changed
   *
   * @param id Id
   * @param properties Updated properties
   * @param errorMessage Error message
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
      {state.selected.map((item, idx) => (
        <DocumentTemplateItem key={idx} item={item} onInputChanged={onInputChanged} />
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
