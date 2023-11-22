import { PopoverProps } from '@fluentui/react-components'
import { useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../riskAction/context'
import { RiskActionPlannerTask } from '../../../../riskAction/types'
import { IPlannerTaskItemProps } from './types'

/**
 * Custom hook for retrieving and managing a planner task item.
 *
 * @param props - The props for the planner task item.
 *
 * @returns An object containing the `onOpenChange` function, `loading` state, and `task` state.
 */
export function usePlannerTaskItem(props: IPlannerTaskItemProps) {
  const context = useRiskActionFieldCustomizerContext()
  const [task, setTask] = useState<RiskActionPlannerTask>(new RiskActionPlannerTask())

  const onOpenChange: PopoverProps['onOpenChange'] = async (_e, { open }) => {
    if (open) {
      const task = await context.dataAdapter.getTask(props.task.id)
      setTask(task)
    }
  }

  /**
   * Creates a link to a planner task in the Office tasks app.
   *
   * @param id - The ID of the task.
   * @param type - The type of the task link. Default value is `TaskLink`.
   * @param channel - The channel of the task link. Default value is `Link`.
   *
   * @returns The link to the planner task.
   */
  function createPlannerTaskLink(id: string, type = 'TaskLink', channel = 'Link') {
    return `https://tasks.office.com/home/task/${id}?type=${type}&channel=${channel}`
  }

  const taskLink = createPlannerTaskLink(props.task.id)

  return { onOpenChange, task, taskLink }
}
