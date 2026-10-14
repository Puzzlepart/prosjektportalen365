import { Field, ProgressBar } from '@fluentui/react-components'
import { FileTypeIcon } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './CopyProgressScreen.module.scss'
import { ICopyProgressScreenProps } from './types'

/**
 * The screen shown while the copies are made: the file being copied and how far the copy is.
 */
export const CopyProgressScreen: FC<ICopyProgressScreenProps> = (props) => (
  <div className={styles.root}>
    <FileTypeIcon className={styles.icon} {...props.iconOptions} />
    <Field className={styles.indicator} label={strings.CopyProgressLabel} hint={props.description}>
      <ProgressBar value={props.percentComplete} />
    </Field>
  </div>
)

CopyProgressScreen.displayName = 'CopyProgressScreen'
