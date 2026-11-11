import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  FluentProvider,
  IdPrefixProvider,
  ProgressBar,
  useId
} from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import styles from './ProgressDialog.module.scss'

export const ProgressDialog: FC = () => {
  const context = useProjectInformationContext()
  const fluentProviderId = useId('fp-progress-dialog')
  if (!context.state.progressDialog) return null
  const { title, progress } = context.state.progressDialog

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        {/* `alert` because the operation must finish; there is nothing to dismiss to. */}
        <Dialog open modalType='alert'>
          <DialogSurface className={styles.root}>
            <DialogBody>
              <DialogTitle>{title}</DialogTitle>
              <DialogContent>
                <Field label={progress.label} hint={progress.description}>
                  <ProgressBar value={progress.percentComplete} />
                </Field>
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
