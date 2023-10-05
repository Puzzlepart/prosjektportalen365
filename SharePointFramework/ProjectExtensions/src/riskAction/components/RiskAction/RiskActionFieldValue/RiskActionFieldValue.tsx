import { Button, PopoverTrigger } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import strings from 'ProjectExtensionsStrings'
import React, { FC, ReactElement } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../context'
import { PlannerTaskLink } from './PlannerTaskLink'
import styles from './RiskActionFieldValue.module.scss'
import { useRiskActionFieldValue } from './useRiskActionFieldValue'
import { IRiskActionFieldValueProps } from './types'

/**
 * Renders the field value for a risk action.
 *
 * @param props - The component props.
 *
 * @returns The rendered component.
 */
export const RiskActionFieldValue: FC<IRiskActionFieldValueProps> = (props) => {
  const context = useRiskActionFieldCustomizerContext()
  const { isFieldValueSet, isHiddenFieldValueSet, tasks, horizontalLayout, gap } =
    useRiskActionFieldValue()
  let element: ReactElement = null
  if (isHiddenFieldValueSet) {
    element = (
      <div className={styles.container}>
        <div
          className={styles.linkList}
          style={{ flexDirection: horizontalLayout ? 'row' : 'column', gap }}
        >
          {tasks.map((task, index) => (
            <PlannerTaskLink key={index} task={task} />
          ))}
        </div>
        <PopoverTrigger disableButtonEnhancement>
          <Button
            {...props.adminButton}
            className={styles.adminButton}
          >
            {strings.RiskActionFieldValueAdminButtonText}
          </Button>
        </PopoverTrigger>
      </div>
    )
  } else {
    if (isFieldValueSet) {
      element = (
        <PopoverTrigger disableButtonEnhancement>
          <div className={styles.fieldValue}>{context.itemContext.fieldValue}</div>
        </PopoverTrigger>
      )
    } else {
      element = (
        <PopoverTrigger disableButtonEnhancement>
          <Alert intent='info' className={styles.alert}>
            {context.dataAdapter.globalSettings.get('RiskActionPlannerNoActionsText')}
          </Alert>
        </PopoverTrigger>
      )
    }
  }
  return <div className={styles.riskActionFieldValue}>{element}</div>
}

RiskActionFieldValue.displayName = 'RiskActionFieldValue'
RiskActionFieldValue.defaultProps = {
  adminButton: {
    appearance: 'transparent',
    size: 'small',
  }
}
