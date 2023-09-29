import { Caption1, Link } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import React, { FC } from 'react'
import { IRiskActionProps } from '../types'
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
export const RiskActionFieldValue: FC<IRiskActionProps> = ({ itemContext }) => {
  let fieldValue = null
  if (stringIsNullOrEmpty(itemContext.hiddenFieldValue)) {
    if (stringIsNullOrEmpty(itemContext.fieldValue))
      fieldValue = <Caption1>Det er ikke registrert noen tiltak for denne usikkerheten.</Caption1>
    else fieldValue = itemContext.fieldValue
  } else {
    fieldValue = (
      <ul className={styles.linkList}>
        {itemContext.hiddenFieldValue
          .split('|')
          .map((item) => item.split(','))
          .map(([id, title], index) => {
            return (
              <li key={index}>
                <Link href={createPlannerTaskLink(id)} target='_blank' appearance='subtle'>
                  {title}
                </Link>
              </li>
            )
          })}
      </ul>
    )
  }
  return <div className={styles.root}>{fieldValue}</div>
}