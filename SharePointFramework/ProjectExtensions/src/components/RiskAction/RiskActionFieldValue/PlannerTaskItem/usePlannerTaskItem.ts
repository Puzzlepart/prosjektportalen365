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

  return { onOpenChange, task }
}
