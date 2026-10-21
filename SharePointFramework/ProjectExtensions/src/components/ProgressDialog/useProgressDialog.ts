import { useAnnounce, useId } from '@fluentui/react-components'
import * as strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { useEffect, useRef, useState } from 'react'
import { IProgressDialogProps } from './types'

/**
 * Component logic hook for `ProgressDialog`: the step the setup is on, how far along it is, and
 * the advanced log. A new step is told to a screen reader as it starts (WCAG 4.1.3), since the bar
 * and the step count change in silence. The dialog closes by itself when the setup is done, unless
 * the log is open.
 *
 * @param props Props for the component
 */
export function useProgressDialog(props: IProgressDialogProps) {
  const [logExpanded, setLogExpanded] = useState(false)
  const logId = useId('progress-log')
  const { announce } = useAnnounce()
  const step = props.progressIndicator?.label
  // The step's number, counted from one; none when the setup does not count its steps.
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
    if (props.isComplete && !logExpanded) {
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
    showContinue: props.isComplete && logExpanded
  } as const
}
