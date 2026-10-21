import { Field, ProgressBar, useAnnounce } from '@fluentui/react-components'
import { FileTypeIcon, format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC, useEffect } from 'react'
import styles from './CopyProgressScreen.module.scss'
import { ICopyProgressScreenProps } from './types'

/**
 * The screen shown while the copies are made: the file being copied and how far the copy is. Each
 * file is told to a screen reader as its copy starts (WCAG 4.1.3), since the bar and the name
 * change in silence.
 */
export const CopyProgressScreen: FC<ICopyProgressScreenProps> = (props) => {
  const { announce } = useAnnounce()
  useEffect(() => {
    if (props.description) {
      announce(format(strings.CopyProgressAnnouncement, props.description), { polite: true })
    }
  }, [props.description])

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

CopyProgressScreen.displayName = 'CopyProgressScreen'
