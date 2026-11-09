import { PopoverProps, useId } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { RiskActionPlannerTask } from '../../../../extensions/riskAction/types'
import { IPlannerTaskItemProps } from './types'

/**
 * Custom hook for retrieving and managing a planner task item.
 *
 * @param props - The props for the planner task item.
 *
 * @returns The preview's handlers and task, whether the task is done, and its name when it is:
 *   struck through to the eye, said in words to a screen reader (WCAG 1.3.1).
 */
export function usePlannerTaskItem(props: IPlannerTaskItemProps) {
  const context = useRiskActionFieldCustomizerContext()
  const [task, setTask] = useState<RiskActionPlannerTask>(new RiskActionPlannerTask())
  const titleId = useId('planner-task-title')

  const onOpenChange: PopoverProps['onOpenChange'] = async (_e, { open }) => {
    if (open) {
      const task = await context.dataAdapter.getTask(props.task.id)
      setTask(task)
    }
  }

  const taskLink = task?.planId
    ? `https://planner.cloud.microsoft/webui/plan/${task.planId}/task/${props.task.id}`
    : `https://tasks.office.com/home/task/${props.task.id}`

  const isCompleted = props.task.isCompleted === '1'
  const label = isCompleted
    ? format(strings.RiskActionTaskCompletedLabel, props.task.title)
    : undefined

  return { onOpenChange, task, taskLink, titleId, isCompleted, label }
}
