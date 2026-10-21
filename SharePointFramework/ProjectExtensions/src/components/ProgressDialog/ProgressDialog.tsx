import {
  Button,
  Divider,
  Field,
  ProgressBar,
  Text,
  useAnnounce,
  useId
} from '@fluentui/react-components'
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useEffect, useRef, useState } from 'react'
import { UserMessage, format, getFluentIconWithFallback } from 'pp365-shared-library'
import { BaseDialog } from '../@BaseDialog'
import styles from './ProgressDialog.module.scss'
import { IProgressDialogProps } from './types'
import { TaskLogSection } from './TaskLogSection'

/**
 * The dialog that shows the setup as it runs: the step it is on, how far along it is, and the
 * advanced log. A new step is told to a screen reader as it starts (WCAG 4.1.3), since the bar
 * and the step count change in silence.
 */
export const ProgressDialog: FC<IProgressDialogProps> = (props) => {
  const [logExpanded, setLogExpanded] = useState(false)
  const logId = useId('progress-log')
  const { announce } = useAnnounce()
  const step = props.progressIndicator?.label
  const isFirstStep = useRef(true)

  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false
      return
    }
    if (!step) return
    announce(
      props.totalSteps > 0
        ? format(
            strings.ProgressStepAnnouncement,
            Math.min((props.currentStep ?? 0) + 1, props.totalSteps),
            props.totalSteps,
            step
          )
        : step,
      { polite: true }
    )
  }, [step])

  const hasTaskProgress = props.taskProgress && props.taskProgress.length > 0
  const hasError =
    !!props.error || (hasTaskProgress && props.taskProgress.some((t) => t.status === 'error'))
  const isExpanded = logExpanded || hasError
  const title = props.title ?? strings.ProgressDialogTitle
  const subText = props.subText ?? strings.ProgressDialogSubText

  useEffect(() => {
    if (props.isComplete && !logExpanded && !props.warning) {
      props.onDismiss?.()
    }
  }, [props.isComplete])

  const footer = props.error ? (
    <Button appearance='primary' onClick={props.onDismiss}>
      {strings.CloseModalText}
    </Button>
  ) : props.isComplete && (logExpanded || props.warning) ? (
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
        <div className={styles.icon}>{getFluentIconWithFallback(props.iconName, { size: 42 })}</div>
        <div className={styles.indicator}>
          <Field label={props.progressIndicator?.label} hint={props.progressIndicator?.description}>
            <ProgressBar
              value={
                props.totalSteps > 0
                  ? Math.min((props.currentStep ?? 0) + 1, props.totalSteps) / props.totalSteps
                  : undefined
              }
            />
          </Field>
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
              aria-expanded={isExpanded}
              aria-controls={logId}
            >
              {strings.ProgressAdvancedLogLabel}
            </Button>
            <Text size={100} className={styles.logDescription}>
              {strings.ProgressAdvancedLogDescription}
            </Text>
          </div>
          <div id={logId} className={styles.logContainer} hidden={!isExpanded}>
            {isExpanded && <TaskLogSection tasks={props.taskProgress} />}
          </div>
        </>
      )}
      {props.error && (
        <UserMessage
          title={props.error.message}
          text={props.error.stack}
          intent='error'
          containerStyle={{ marginTop: 12 }}
        />
      )}
      {props.isComplete && props.warning && (
        <UserMessage
          title={props.warning.title}
          text={props.warning.text}
          intent='warning'
          containerStyle={{ marginTop: 12 }}
        />
      )}
    </BaseDialog>
  )
}
