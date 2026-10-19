import { Button, MessageBar, MessageBarBody, PopoverTrigger } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import React, { FC, ReactElement } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
import { PlannerTaskItem } from './PlannerTaskItem'
import styles from './RiskActionFieldValue.module.scss'
import { IRiskActionFieldValueProps } from './types'
import { useRiskActionFieldValue } from './useRiskActionFieldValue'
import { withDefaults } from 'pp365-shared-library'

const RISK_ACTION_FIELD_VALUE_DEFAULT_PROPS: Partial<IRiskActionFieldValueProps> = {
  adminButton: {
    appearance: 'transparent',
    size: 'small'
  }
}

/**
 * Renders the field value for a risk action.
 *
 * @param props - The component props.
 *
 * @returns The rendered component.
 */
export const RiskActionFieldValue: FC<IRiskActionFieldValueProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, RISK_ACTION_FIELD_VALUE_DEFAULT_PROPS)
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
            <PlannerTaskItem key={index} task={task} />
          ))}
        </div>
        <PopoverTrigger disableButtonEnhancement>
          <Button {...props.adminButton} className={styles.adminButton}>
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
          <MessageBar intent='info' className={styles.alert}>
            <MessageBarBody>
              {context.dataAdapter.globalSettings.get('RiskActionPlannerNoActionsText')}
            </MessageBarBody>
          </MessageBar>
        </PopoverTrigger>
      )
    }
  }
  return <div className={styles.riskActionFieldValue}>{element}</div>
}

RiskActionFieldValue.displayName = 'RiskActionFieldValue'
