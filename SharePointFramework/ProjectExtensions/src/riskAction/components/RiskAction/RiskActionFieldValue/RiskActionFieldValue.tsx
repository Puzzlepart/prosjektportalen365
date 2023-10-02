import { Alert } from '@fluentui/react-components/unstable'
import React, { FC, ReactElement } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../context'
import { PlannerTaskLink } from './PlannerTaskLink'
import styles from './RiskActionFieldValue.module.scss'
import { useRiskActionFieldValue } from './useRiskActionFieldValue'

/**
 * Renders the field value for a risk action.
 *
 * @param props - The component props.
 *
 * @returns The rendered component.
 */
export const RiskActionFieldValue: FC = () => {
  const context = useRiskActionFieldCustomizerContext()
  const { isFieldValueSet, isHiddenFieldValueSet, tasks } = useRiskActionFieldValue()
  let element: ReactElement = null
  if (isHiddenFieldValueSet) {
    element = (
      <ul className={styles.linkList}>
        {tasks.map((task, index) => (
          <li key={index}>
            <PlannerTaskLink task={task} />
          </li>
        ))}
      </ul>
    )
  } else {
    if (isFieldValueSet) {
      element = <div style={{ whiteSpace: 'pre-wrap' }}>{context.itemContext.fieldValue}</div>
    } else {
      element = (
        <Alert className={styles.alert}>
          {context.dataAdapter.globalSettings.get('RiskActionPlannerNoActionsText')}
        </Alert>
      )
    }
  }
  return <div className={styles.riskActionFieldValue}>{element}</div>
}

RiskActionFieldValue.displayName = 'RiskActionFieldValue'
