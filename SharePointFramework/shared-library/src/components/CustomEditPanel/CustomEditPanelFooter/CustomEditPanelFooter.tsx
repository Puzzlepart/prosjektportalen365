import {
  Button,
  Field,
  FluentProvider,
  ProgressBar,
  useId,
  webLightTheme
} from '@fluentui/react-components'
import React, { FC, useState } from 'react'
import styles from './CustomEditPanelFooter.module.scss'
import { ICustomEditPanelFooterProps } from './types'
import strings from 'SharedLibraryStrings'
import { UserMessage } from '../../UserMessage'

/**
 * Renders the footer for the `CustomEditPanel` with a `<PrimaryButton />` for saving the changes,
 * and a `<ClosePanelButton />` for closing the panel. Also shows a `<ProgressBar />` when submitting
 * with text based on the `saveProgressText` property from `props.submit`.
 *
 * @param props The component props.
 */
export const CustomEditPanelFooter: FC<ICustomEditPanelFooterProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  const [isSaving, setIsSaving] = useState(false)

  /**
   * Handles the form submission by calling the `onSubmit` function passed in through props
   * and updating the `isSaving` state accordingly.
   */
  const handleOnSubmit = async () => {
    setIsSaving(true)
    await props.submit.onSubmit(props.model)
    setIsSaving(false)
  }

  return (
    <FluentProvider id={fluentProviderId} theme={webLightTheme} className={styles.root}>
      {props.submit.error && (
        <div className={styles.errorContainer}>
          <UserMessage text={props.submit.error} intent='error' />
        </div>
      )}
      <div className={styles.container}>
        {isSaving ? (
          <Field validationMessage={props.submit.saveProgressText} validationState='none'>
            <ProgressBar />
          </Field>
        ) : (
          <>
            <Button
              onClick={handleOnSubmit}
              disabled={isSaving || props.submit.disabled}
              appearance='primary'
            >
              {props.submit.text ?? strings.SaveText}
            </Button>
            <Button appearance='secondary' onClick={props.onDismiss}>
              {strings.CloseText}
            </Button>
          </>
        )}
      </div>
    </FluentProvider>
  )
}

CustomEditPanelFooter.displayName = 'CustomEditPanelFooter'
