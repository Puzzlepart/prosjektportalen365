import { useAnnounce, useId } from '@fluentui/react-components'
import * as strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { useEffect, useRef, useState } from 'react'
import { IProgressDialogProps } from './types'

/** Tracks setup progress, announces step changes and controls completion dismissal. */
export function useProgressDialog(props: IProgressDialogProps) {
  const [logExpanded, setLogExpanded] = useState(false)
  const logId = useId('progress-log')
  const { announce } = useAnnounce()
  const step = props.progressIndicator?.label
  const stepNumber =
    props.totalSteps > 0 ? Math.min((props.currentStep ?? 0) + 1, props.totalSteps) : undefined
  const isFirstStep = useRef(true)

  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false
      return
    }
    if (!step) return
    announce(
      stepNumber !== undefined
        ? format(strings.ProgressStepAnnouncement, stepNumber, props.totalSteps, step)
        : step,
      { polite: true }
    )
  }, [step])

  useEffect(() => {
    if (props.isComplete && !logExpanded && !props.warning) {
      props.onDismiss?.()
    }
  }, [props.isComplete])

  const hasTaskProgress = !!props.taskProgress && props.taskProgress.length > 0
  const hasError =
    !!props.error || (hasTaskProgress && props.taskProgress.some((t) => t.status === 'error'))

  return {
    title: props.title ?? strings.ProgressDialogTitle,
    subText: props.subText ?? strings.ProgressDialogSubText,
    progressValue: stepNumber !== undefined ? stepNumber / props.totalSteps : undefined,
    stepCountText:
      stepNumber !== undefined
        ? format(strings.ProgressStepCountText, String(stepNumber), String(props.totalSteps))
        : undefined,
    hasTaskProgress,
    isLogExpanded: logExpanded || hasError,
    toggleLog: () => setLogExpanded(!logExpanded),
    logId,
    showContinue: props.isComplete && (logExpanded || !!props.warning)
  } as const
}
