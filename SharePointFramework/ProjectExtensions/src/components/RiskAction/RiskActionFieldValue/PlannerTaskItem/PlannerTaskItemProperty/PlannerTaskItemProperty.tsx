import React, { FC } from 'react'
import styles from './PlannerTaskItemProperty.module.scss'
import { IPlannerTaskItemPropertyProps } from './types'
import _ from 'lodash'

export const PlannerTaskItemProperty: FC<IPlannerTaskItemPropertyProps> = (props) => {
  const hidden = !props.value && (!props.children || _.isEmpty(props.children))
  return (
    <div className={styles.plannerTaskItemProperty} hidden={hidden}>
      <div className={styles.label} hidden={!props.label}>
        {props.label}
      </div>
      <div className={styles.value} hidden={!props.value}>
        <span>{props.value}</span>
      </div>
      <div style={{ marginTop: 8 }}>{props.children}</div>
    </div>
  )
}

PlannerTaskItemProperty.displayName = 'PlannerTaskItemProperty'
PlannerTaskItemProperty.defaultProps = {}
