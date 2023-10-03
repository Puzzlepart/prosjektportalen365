import { Link, Tooltip, mergeClasses } from '@fluentui/react-components'
import React, { FC } from 'react'
import { RiskActionPlannerTaskReference } from '../../../../types'
import styles from './PlannerTaskLink.module.scss'
import { getFluentIcon } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'

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
  <div className={styles.plannerTaskLink}>
    <Link href={createPlannerTaskLink(task.id)} target='_blank' appearance='subtle'>
      <Tooltip
        content={
          <div className={styles.plannerTaskLinkTooltip}>
            <div className={styles.title}>{task.title}</div>
            {task.isCompleted === '1' && (
              <div className={styles.completedText}>
                {getFluentIcon('Checkmark', { color: 'green' })}
                <span>{strings.RiskActionPlannerTaskLinkTooltipCompletedText}</span>
              </div>
            )}
          </div>
        }
        relationship='label'
      >
        <div className={mergeClasses(styles.text, task.isCompleted === '1' && styles.isCompleted)}>
          {task.title}
        </div>
      </Tooltip>
    </Link>
  </div>
)
