import { Icon, ProgressIndicator } from '@fluentui/react'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog/index'
import styles from './ProgressDialog.module.scss'
import { IProgressDialogProps } from './types'

export const ProgressDialog: FC<IProgressDialogProps> = (props) => {
  return (
    <BaseDialog
      version={props.version}
      modalProps={{ isBlocking: true, isDarkOverlay: true, containerClassName: styles.root }}
      dialogContentProps={{
        title: strings.ProgressDialogTitle,
        subText: strings.ProgressDialogSubText,
        className: styles.content,
        ...props.dialogContentProps
      }}
      onDismiss={props.onDismiss}
    >
      <div className={styles.icon}>
        <Icon
          iconName={props.iconName}
          style={{ fontSize: 42, display: 'block', textAlign: 'center' }}
        />
      </div>
      <div className={styles.indicator}>
        <ProgressIndicator {...props.progressIndicator} />
      </div>
    </BaseDialog>
  )
}

export * from './types'
