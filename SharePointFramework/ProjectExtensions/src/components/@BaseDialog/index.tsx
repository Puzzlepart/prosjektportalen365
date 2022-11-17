import { Dialog, DialogType, IDialogContentProps, IModalProps } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './BaseDialog.module.scss'
import { IBaseDialogProps } from './types'

export const BaseDialog: FC<IBaseDialogProps> = (props) => {
  const modalProps: IModalProps = {
    ...props.modalProps,
    containerClassName: [styles.root, props.modalProps?.containerClassName]
      .filter((c) => c)
      .join(' '),
    onDismiss: props.onDismiss
  }

  const dialogContentProps: IDialogContentProps = {
    ...props.dialogContentProps,
    type: DialogType.largeHeader,
    onDismiss: props.onDismiss
  }

  return (
    <Dialog
      hidden={false}
      modalProps={modalProps}
      dialogContentProps={dialogContentProps}
      onDismiss={props.onDismiss}>
      <span hidden={!props.version} className={styles.version}>
        {props.version}
      </span>
      {props.children}
    </Dialog>
  )
}
