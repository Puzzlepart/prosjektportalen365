import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './CopyProgressScreen.module.scss'
import { ICopyProgressScreenProps } from './types'
import { Field, ProgressBar } from '@fluentui/react-components'
import { FileTypeIcon } from 'pp365-shared-library'

export const CopyProgressScreen: FC<ICopyProgressScreenProps> = (props) => {
  return (
    <div className={styles.root}>
      <FileTypeIcon className={styles.icon} {...props.iconOptions} />
      <Field
        className={styles.indicator}
        label={strings.CopyProgressLabel}
        hint={props.description}
      >
        <ProgressBar value={props.percentComplete} />
      </Field>
    </div>
  )
}
