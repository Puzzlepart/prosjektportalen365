import { Icon, ProgressIndicator } from '@fluentui/react'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './CopyProgressScreen.module.scss'
import { ICopyProgressScreenProps } from './types'

export const CopyProgressScreen: FC<ICopyProgressScreenProps> = (props) => {
  return (
    <div className={styles.root}>
      <Icon className={styles.icon} {...props.iconProps} />
      <ProgressIndicator
        className={styles.indicator}
        label={strings.CopyProgressLabel}
        description={props.description}
        percentComplete={props.percentComplete}
      />
    </div>
  )
}
