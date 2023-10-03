import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ClosePanelButton } from '../../BasePanel'
import { IEditPropertiesPanelFooterProps } from './types'
import styles from './EditPropertiesPanelFooter.module.scss'
import { UserMessage } from 'pp365-shared-library/lib/components'
import { Button, FluentProvider, Spinner, useId, webLightTheme } from '@fluentui/react-components'

/**
 * Renders the footer for the `EditPropertiesPanel` with a `<PrimaryButton />` for saving the changes,
 * and a `<ClosePanelButton />` for closing the panel. Also shows a spinner when submitting with a `label`
 * based on the `saveStatus` property from `props.submit`.
 *
 * @param props The component props.
 */
export const EditPropertiesPanelFooter: FC<IEditPropertiesPanelFooterProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  const isSaving = !!props.submit.saveStatus

  return (
    <FluentProvider id={fluentProviderId} theme={webLightTheme} className={styles.root}>
      {props.submit.error && (
        <div className={styles.errorContainer}>
          <UserMessage text={props.submit.error.customMessage} intent='error' />
        </div>
      )}
      <div className={styles.container}>
        <Button
          appearance='primary'
          onClick={props.submit.onSave}
          disabled={!props.model.isChanged || isSaving || !!props.submit.error}
        >
          {strings.SaveText}
        </Button>
        <ClosePanelButton
          onClick={() => {
            props.model.reset()
          }}
          disabled={isSaving}
        />
        {isSaving && (
          <div className={styles.saveStatusSpinner}>
            <Spinner {...props.spinner} label={props.submit.saveStatus} />
          </div>
        )}
      </div>
    </FluentProvider>
  )
}

EditPropertiesPanelFooter.defaultProps = {
  spinner: {
    labelPosition: 'after',
    size: 'medium'
  }
}
