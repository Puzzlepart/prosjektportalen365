import React, { FC } from 'react'
import styles from './PlannerTaskItemProperty.module.scss'
import { IPlannerTaskItemPropertyProps } from './types'
import _ from 'lodash'

/**
 * A property of a Planner task in its preview: its name as a term and its value, or the people
 * given, as the description, within the preview's description list (WCAG 1.3.1). Hidden while it
 * has neither.
 */
export const PlannerTaskItemProperty: FC<IPlannerTaskItemPropertyProps> = (props) => {
  const hidden = !props.value && (!props.children || _.isEmpty(props.children))
  return (
    <div className={styles.plannerTaskItemProperty} hidden={hidden}>
      <dt className={styles.label} hidden={!props.label}>
        {props.label}
      </dt>
      <dd className={styles.value}>
        {props.value && <span>{props.value}</span>}
        {props.children && <div style={{ marginTop: 8 }}>{props.children}</div>}
      </dd>
    </div>
  )
}

PlannerTaskItemProperty.displayName = 'PlannerTaskItemProperty'
