import { PopoverProps, useId } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { RiskActionPlannerTask } from '../../../../extensions/riskAction/types'
import { IPlannerTaskItemProps } from './types'

/** Loads task details when its preview opens and derives its Planner link and completion label. */
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
