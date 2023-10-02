import { Link, mergeClasses } from '@fluentui/react-components'
import React, { FC } from 'react'
import { RiskActionPlannerTaskReference } from '../../../types'
import styles from './RiskActionFieldValue.module.scss'

/**
 * Creates a link to a planner task in the Office tasks app.
 *
 * @param id - The ID of the task.
 * @param type - The type of the task link. Default value is 'TaskLink'.
 * @param channel - The channel of the task link. Default value is 'Link'.
 *
 * @returns The link to the planner task.
 */
function createPlannerTaskLink(id: string, type = 'TaskLink', channel = 'Link') {
  return `https://tasks.office.com/puzzlepart.onmicrosoft.com/home/task/${id}?type=${type}&channel=${channel}`
}

export const PlannerTaskLink: FC<{ task: RiskActionPlannerTaskReference }> = ({ task }) => (
  <Link
    href={createPlannerTaskLink(task.id)}
    target='_blank'
    appearance='subtle'
    className={mergeClasses(styles.taskLink, task.isCompleted === '1' && styles.isCompleted)}
  >
    {task.title}
  </Link>
)
