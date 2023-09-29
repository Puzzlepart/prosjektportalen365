import { Link, mergeClasses } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import React, { FC, ReactElement } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../context'
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

/**
 * Renders the field value for a risk action.
 *
 * @param props - The component props.
 *
 * @returns The rendered component.
 */
export const RiskActionFieldValue: FC = () => {
  const { itemContext } = useRiskActionFieldCustomizerContext()
  let element: ReactElement = null
  const hiddenFieldValue = itemContext.hiddenFieldValue
  if (stringIsNullOrEmpty(hiddenFieldValue?.data)) {
    if (stringIsNullOrEmpty(itemContext.fieldValue))
      element = <Alert className={styles.alert}>{strings.RiskActionFieldValueNoTasks}</Alert>
    else element = <span>{itemContext.fieldValue}</span>
  } else {
    element = (
      <ul className={styles.linkList}>
        {hiddenFieldValue.tasks.map((task, index) => {
          return (
            <li key={index}>
              <Link
                href={createPlannerTaskLink(task.id)}
                target='_blank'
                appearance='subtle'
                className={mergeClasses(
                  styles.taskLink,
                  task.percentComplete === '100' && styles.isCompleted
                )}
              >
                {task.title}
              </Link>
            </li>
          )
        })}
      </ul>
    )
  }
  return <div className={styles.riskActionFieldValue}>{element}</div>
}

RiskActionFieldValue.displayName = 'RiskActionFieldValue'
