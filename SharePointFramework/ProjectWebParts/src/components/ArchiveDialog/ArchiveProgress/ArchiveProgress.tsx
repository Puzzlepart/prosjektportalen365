import { ProgressBar, Text } from '@fluentui/react-components'
import { DocumentMultiple20Regular, ListBar20Regular } from '@fluentui/react-icons'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './ArchiveProgress.module.scss'

export interface IArchiveProgressStep {
  current: number
  total: number
}

export interface IArchiveProgressProps {
  documents: IArchiveProgressStep
  lists: IArchiveProgressStep
}

interface IIndicatorProps {
  label: string
  step: IArchiveProgressStep
  Icon: FC<{ className?: string }>
}

const Indicator: FC<IIndicatorProps> = ({ label, step, Icon }) => {
  const value = step.total > 0 ? step.current / step.total : 0
  return (
    <div className={styles.indicator}>
      <div className={styles.header}>
        <Icon className={styles.icon} />
        <span>{label}</span>
        <span className={styles.count}>
          {step.current} / {step.total}
        </span>
      </div>
      <ProgressBar thickness='medium' value={value} max={1} />
    </div>
  )
}

export const ArchiveProgress: FC<IArchiveProgressProps> = ({ documents, lists }) => (
  <div className={styles.archiveProgress}>
    <Text className={styles.subText}>{strings.ArchiveProgressSubText}</Text>
    {documents.total > 0 && (
      <Indicator
        label={strings.ArchiveDocumentsSection}
        step={documents}
        Icon={DocumentMultiple20Regular}
      />
    )}
    {lists.total > 0 && (
      <Indicator label={strings.ArchiveListsSection} step={lists} Icon={ListBar20Regular} />
    )}
  </div>
)
