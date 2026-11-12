import React, { FC } from 'react'
import styles from './PlannerTaskItemProperty.module.scss'
import { IPlannerTaskItemPropertyProps } from './types'
import _ from 'lodash'

/** Renders a nonempty task property as a term and description in the preview's definition list. */
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
