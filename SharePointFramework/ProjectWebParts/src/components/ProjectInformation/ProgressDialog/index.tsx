import { Dialog, DialogType } from '@fluentui/react/lib/Dialog'
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import styles from './ProgressDialog.module.scss'

export const ProgressDialog: FC = () => {
  const context = useProjectInformationContext()
  if (!context.state.progressDialog) return null
  const { title, progress } = context.state.progressDialog
  return (
    <Dialog
      hidden={false}
      dialogContentProps={{ title, type: DialogType.largeHeader }}
      modalProps={{ isBlocking: true, isDarkOverlay: true, containerClassName: styles.root }}
    >
      <ProgressIndicator {...progress} />
    </Dialog>
  )
}
