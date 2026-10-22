import { Button, Divider, Field, ProgressBar, Text } from '@fluentui/react-components'
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { UserMessage, getFluentIconWithFallback } from 'pp365-shared-library'
import { BaseDialog } from '../@BaseDialog'
import styles from './ProgressDialog.module.scss'
import { IProgressDialogProps } from './types'
import { TaskLogSection } from './TaskLogSection'
import { useProgressDialog } from './useProgressDialog'

/**
 * The dialog that shows the setup as it runs: the step it is on, how far along it is, and the
 * advanced log. A new step is told to a screen reader as it starts (`useProgressDialog`).
 */
export const ProgressDialog: FC<IProgressDialogProps> = (props) => {
  const {
    title,
    subText,
    progressValue,
    stepCountText,
    hasTaskProgress,
    isLogExpanded,
    toggleLog,
    logId,
    showContinue
  } = useProgressDialog(props)

  const footer = props.error ? (
    <Button appearance='primary' onClick={props.onDismiss}>
      {strings.CloseModalText}
    </Button>
  ) : showContinue ? (
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
            <ProgressBar value={progressValue} />
          </Field>
          {stepCountText && (
            <Text size={200} className={styles.stepCount}>
              {stepCountText}
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
              icon={isLogExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
              onClick={toggleLog}
              aria-expanded={isLogExpanded}
              aria-controls={logId}
            >
              {strings.ProgressAdvancedLogLabel}
            </Button>
            <Text size={100} className={styles.logDescription}>
              {strings.ProgressAdvancedLogDescription}
            </Text>
          </div>
          <div id={logId} className={styles.logContainer} hidden={!isLogExpanded}>
            {isLogExpanded && <TaskLogSection tasks={props.taskProgress} />}
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
    </BaseDialog>
  )
}
