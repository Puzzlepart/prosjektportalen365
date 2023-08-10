import { PrimaryButton, Spinner } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ClosePanelButton } from '../../BasePanel'
import { IEditPropertiesPanelFooterProps } from './types'
import styles from './EditPropertiesPanelFooter.module.scss'

/**
 * Renders the footer for the `EditPropertiesPanel` with a `<PrimaryButton />` for saving the changes,
 * and a `<ClosePanelButton />` for closing the panel. Also shows a spinner when submitting.
 */
export const EditPropertiesPanelFooter: FC<IEditPropertiesPanelFooterProps> = (props) => {
  const isSaving = props.submit.saveStatus !== undefined
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <PrimaryButton
          text={strings.SaveText}
          onClick={props.submit.onSave}
          disabled={!props.model.isChanged || isSaving} />
        <ClosePanelButton
          onClick={() => {
            props.model.reset()
          }}
          disabled={isSaving}
        />
        {isSaving && (
          <Spinner label={props.submit.saveStatus} />
        )}
      </div>
    </div>
  )
}
