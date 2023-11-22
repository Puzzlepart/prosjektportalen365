
import React, { FC } from 'react'
import styles from './PlannerTaskItemProperty.module.scss'
import { IPlannerTaskItemPropertyProps } from './types'
import { getFluentIcon } from 'pp365-shared-library'

export const PlannerTaskItemProperty: FC<IPlannerTaskItemPropertyProps> = (props) => {
    return (
        <div className={styles.plannerTaskItemProperty}>
            <div className={styles.label} hidden={!props.label}>{props.label}</div>
            <div className={styles.value} hidden={!props.value}>
                <span>{props.value}</span>
            </div>
            {props.children}
        </div>
    )
}

PlannerTaskItemProperty.displayName = 'PlannerTaskItemProperty'
PlannerTaskItemProperty.defaultProps = {}