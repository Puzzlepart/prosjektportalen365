/* eslint-disable @typescript-eslint/no-empty-function */
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator'
import * as strings from 'ProjectExtensionsStrings'
import React from 'react'
import styles from './CopyProgressScreen.module.scss'
import { ICopyProgressScreenProps } from './types'

export const CopyProgressScreen = (props: ICopyProgressScreenProps) => {
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
