import { Icon, ProgressIndicator } from '@fluentui/react'
import * as strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import styles from './CopyProgressScreen.module.scss'
import { ICopyProgressScreenProps } from './types'

export const CopyProgressScreen: FunctionComponent<ICopyProgressScreenProps> = (props) => {
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
