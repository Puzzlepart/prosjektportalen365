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
  const { isFieldValueSet, isHiddenFieldValueSet, tasks, horizontalLayout, gap } = useRiskActionFieldValue()
  let element: ReactElement = null
  if (isHiddenFieldValueSet) {
    element = (
      <div className={styles.linkList} style={{ flexDirection: horizontalLayout ? 'row' : 'column', gap }}>
        {tasks.map((task, index) => (
            <PlannerTaskLink key={index} task={task} />
        ))}
      </div>
    )
  } else {
    if (isFieldValueSet) {
      element = <div style={{ whiteSpace: 'pre-wrap' }}>{context.itemContext.fieldValue}</div>
    } else {
      element = (
        <Alert intent='info' className={styles.alert}>
          {context.dataAdapter.globalSettings.get('RiskActionPlannerNoActionsText')}
        </Alert>
      )
    }
  }
  return <div className={styles.riskActionFieldValue}>{element}</div>
}

RiskActionFieldValue.displayName = 'RiskActionFieldValue'
