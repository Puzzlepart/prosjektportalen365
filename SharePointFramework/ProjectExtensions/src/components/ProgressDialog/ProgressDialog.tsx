import { Icon, ProgressIndicator } from '@fluentui/react'
import { Text, Divider, Button } from '@fluentui/react-components'
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useEffect, useState } from 'react'
import { format } from '@uifabric/utilities'
import { BaseDialog } from '../@BaseDialog'
import styles from './ProgressDialog.module.scss'
import { IProgressDialogProps } from './types'
import { TaskLogSection } from './TaskLogSection'

export const ProgressDialog: FC<IProgressDialogProps> = (props) => {
  const [logExpanded, setLogExpanded] = useState(false)

  const hasTaskProgress = props.taskProgress && props.taskProgress.length > 0
  const hasError = hasTaskProgress && props.taskProgress.some((t) => t.status === 'error')

  // Auto-expand on error
  const isExpanded = logExpanded || hasError

  const title = props.title ?? strings.ProgressDialogTitle
  const subText = props.subText ?? strings.ProgressDialogSubText

  useEffect(() => {
    if (props.isComplete && !logExpanded) {
      props.onDismiss?.()
    }
  }, [props.isComplete])

  const footer = props.isComplete && logExpanded ? (
    <Button appearance='primary' onClick={props.onDismiss}>
      {strings.ContinueToProjectText}
    </Button>
  ) : undefined

  return (
    <BaseDialog
      version={props.version}
      isBlocking={true}
      containerClassName={styles.root}
      contentClassName={styles.content}
      title={title}
      onDismiss={props.onDismiss}
      footer={footer}
    >
      <p className={styles.subText}>{subText}</p>
      <div className={styles.progressSection}>
        <div className={styles.icon}>
          <Icon
            iconName={props.iconName}
            style={{ fontSize: 42, display: 'block', textAlign: 'center' }}
          />
        </div>
        <div className={styles.indicator}>
          <ProgressIndicator
            {...props.progressIndicator}
            percentComplete={
              props.totalSteps > 0 ? (props.currentStep ?? 0) / props.totalSteps : undefined
            }
          />
          {props.totalSteps > 0 && (
            <Text size={200} className={styles.stepCount}>
              {format(
                strings.ProgressStepCountText,
                String(Math.min((props.currentStep ?? 0) + 1, props.totalSteps)),
                String(props.totalSteps)
              )}
            </Text>
          )}
        </div>
      </div>

      {hasTaskProgress && (
        <>
          <Divider className={styles.logDivider} />
          <div className={styles.logToggle}>
            <Button
              appearance='subtle'
              size='small'
              icon={isExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
              onClick={() => setLogExpanded(!logExpanded)}
            >
              {strings.ProgressAdvancedLogLabel}
            </Button>
            <Text size={100} className={styles.logDescription}>
              {strings.ProgressAdvancedLogDescription}
            </Text>
          </div>
          {isExpanded && (
            <div className={styles.logContainer}>
              <TaskLogSection tasks={props.taskProgress} />
            </div>
          )}
        </>
      )}
    </BaseDialog>
  )
}
