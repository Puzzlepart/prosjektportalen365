import { Button, Field, FluentProvider, ProgressBar, useId, webLightTheme } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './EditPropertiesPanelFooter.module.scss'
import { IEditPropertiesPanelFooterProps } from './types'

/**
 * Renders the footer for the `EditPropertiesPanel` with a `<PrimaryButton />` for saving the changes,
 * and a `<ClosePanelButton />` for closing the panel. Also shows a spinner when submitting with a `label`
 * based on the `saveStatus` property from `props.submit`.
 *
 * @param props The component props.
 */
export const EditPropertiesPanelFooter: FC<IEditPropertiesPanelFooterProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  const isSaving = false

  return (
    <FluentProvider id={fluentProviderId} theme={webLightTheme} className={styles.root}>
      {/* {props.submit.error && (
        <div className={styles.errorContainer}>
          <UserMessage text={props.submit.error.customMessage} intent='error' />
        </div>
      )} */}
      <div className={styles.container}>
        {isSaving ? (
          <Field
            // validationMessage={props.submit.saveStatus} 
            validationState='none'>
            <ProgressBar />
          </Field>
        ) : (
          <>
            <Button
              appearance='primary'
            // onClick={props.submit.onSave}
            // disabled={!props.model.isChanged || !!props.submit.error}
            >
              strings.SaveText
            </Button>
            {/* <ClosePanelButton
              onClick={() => {
                props.model.reset()
              }}
            /> */}
          </>
        )}
      </div>
    </FluentProvider>
  )
}

EditPropertiesPanelFooter.displayName = 'EditPropertiesPanelFooter'
