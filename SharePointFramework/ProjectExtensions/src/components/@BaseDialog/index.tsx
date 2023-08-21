import React, { FC } from 'react'
import styles from './BaseDialog.module.scss'
import { IBaseDialogProps } from './types'
import {
  Dialog, DialogActions, DialogContent, DialogSurface, DialogTitle,
} from '@fluentui/react-components'

export const BaseDialog: FC<IBaseDialogProps> = (props) => {
  return (
    <Dialog defaultOpen={true}>
      <DialogSurface>
        <span hidden={!props.version} className={styles.version}>
          {props.version}
        </span>
        <DialogTitle>Dialog title</DialogTitle>
        <DialogContent>{props.content}</DialogContent>
        <DialogActions>{props.actions}</DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
