import { stringIsNullOrEmpty } from '@pnp/core'
import { useRiskActionContext } from '../context'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
import { textBesidesTasks } from '../../../extensions/riskAction/types'

/**
 * Custom hook that returns the field value and hidden field value for a risk action item, and the
 * text written in the field besides the Planner tasks (an action whose task Planner refused at the
 * migration), shown under them.
 */
export function useRiskActionFieldValue() {
  const { dataAdapter } = useRiskActionFieldCustomizerContext()
  const { itemContext } = useRiskActionContext()
  const hiddenFieldValue = itemContext.hiddenFieldValues
  const isFieldValueSet = !stringIsNullOrEmpty(itemContext.fieldValue)
  const isHiddenFieldValueSet = !stringIsNullOrEmpty(hiddenFieldValue?.data)
  const horizontalLayout =
    dataAdapter.globalSettings.get('RiskActionPlannerHorizontalLayout') === '1'
  const gap = dataAdapter.globalSettings.get('RiskActionPlannerGap') ?? '0px'
  const tasks = hiddenFieldValue?.tasks ?? []
  return {
    isFieldValueSet,
    isHiddenFieldValueSet,
    tasks,
    textBesidesTasks: textBesidesTasks(itemContext.fieldValue, tasks).join('\n'),
    fieldValue: itemContext.fieldValue,
    horizontalLayout,
    gap
  }
}
