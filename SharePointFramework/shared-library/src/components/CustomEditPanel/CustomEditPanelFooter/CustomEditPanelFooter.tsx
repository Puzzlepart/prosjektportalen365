import {
  Button,
  Field,
  FluentProvider,
  IdPrefixProvider,
  ProgressBar,
  useId
} from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC, useState } from 'react'
import { UserMessage } from '../../UserMessage'
import { useCustomEditPanelContext } from '../context'
import styles from './CustomEditPanelFooter.module.scss'
import { customLightTheme } from '../../../util'
import { ICustomEditPanelFooterProps } from './types'

/**
 * Renders the footer for the `CustomEditPanel` with a `<PrimaryButton />` for saving the changes,
 * and a `<ClosePanelButton />` for closing the panel. Also shows a `<ProgressBar />` when submitting
 * with text based on the `saveProgressText` property from `props.submit`.
 *
 * @param props - The props for the component.
 */
export const CustomEditPanelFooter: FC<ICustomEditPanelFooterProps> = ({ isSaveDisabled }) => {
  const context = useCustomEditPanelContext()
  const fluentProviderId = useId('fp-custom-edit-panel-footer')
  const [isSaving, setIsSaving] = useState(false)

  /**
   * Handles the form submission by calling the `onSubmit` function passed in through props
   * and updating the `isSaving` state accordingly.
   */
  const handleOnSubmit = async () => {
    setIsSaving(true)
    await context.props.submit.onSubmit(context.model)
    setIsSaving(false)
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.customEditPanelFooter}>
        {context.props.submit.error && (
          <div className={styles.errorContainer}>
            <UserMessage text={context.props.submit.error} intent='error' />
          </div>
        )}
        <div className={styles.container}>
          {isSaving ? (
            <Field validationMessage={context.props.submit.saveProgressText} validationState='none'>
              <ProgressBar />
            </Field>
          ) : (
            <>
              <Button
                onClick={handleOnSubmit}
                disabled={isSaving || context.props.submit.disabled || isSaveDisabled}
                title={isSaveDisabled ? strings.Aria.SaveDisabledTitle : strings.Aria.SaveTitle}
                appearance='primary'
              >
                {context.props.submit.text ?? strings.SaveText}
              </Button>
              <Button appearance='secondary' onClick={context.props.onDismiss}>
                {strings.CloseText}
              </Button>
            </>
          )}
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

CustomEditPanelFooter.displayName = 'CustomEditPanelFooter'
