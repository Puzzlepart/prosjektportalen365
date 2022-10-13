import { Dialog } from '@fluentui/react/lib/Dialog'
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator'
import React from 'react'
import { IProgressDialogProps } from './types'
import styles from './ProgressDialog.module.scss'

export const ProgressDialog = ({ title, progress }: IProgressDialogProps) => {
  if (!progress) return null
  return (
    <Dialog
      hidden={false}
      dialogContentProps={{ title }}
      modalProps={{ isBlocking: true, isDarkOverlay: true }}
      containerClassName={styles.progressDialog}>
      <ProgressIndicator {...progress} />
    </Dialog>
  )
}
