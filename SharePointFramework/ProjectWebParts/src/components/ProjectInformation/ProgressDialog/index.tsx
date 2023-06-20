import { Dialog, DialogType } from '@fluentui/react/lib/Dialog'
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator'
import React, { FC } from 'react'
import { IProgressDialogProps } from './types'
import styles from './ProgressDialog.module.scss'

export const ProgressDialog: FC<IProgressDialogProps> = (props) => {
  if (!props.progress) return null
  return (
    <Dialog
      hidden={false}
      dialogContentProps={{ title: props.title, type: DialogType.largeHeader }}
      modalProps={{ isBlocking: true, isDarkOverlay: true }}
      containerClassName={styles.root}
    >
      <ProgressIndicator {...props.progress} />
    </Dialog>
  )
}
