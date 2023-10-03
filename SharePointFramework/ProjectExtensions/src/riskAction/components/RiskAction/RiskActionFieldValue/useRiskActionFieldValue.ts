import { stringIsNullOrEmpty } from '@pnp/core'
import { useRiskActionContext } from '../context'
import { useRiskActionFieldCustomizerContext } from '../../../context'

/**
 * Custom hook that returns the field value and hidden field value for a risk action item.
 */
export function useRiskActionFieldValue() {
  const { dataAdapter } = useRiskActionFieldCustomizerContext()
  const { itemContext } = useRiskActionContext()
  const hiddenFieldValue = itemContext.hiddenFieldValue
  const isFieldValueSet = !stringIsNullOrEmpty(itemContext.fieldValue)
  const isHiddenFieldValueSet = !stringIsNullOrEmpty(hiddenFieldValue?.data)
  const horizontalLayout =
    dataAdapter.globalSettings.get('RiskActionPlannerHorizontalLayout') === '1'
  const gap = dataAdapter.globalSettings.get('RiskActionPlannerGap') ?? '0px'
  return {
    isFieldValueSet,
    isHiddenFieldValueSet,
    tasks: hiddenFieldValue?.tasks ?? [],
    fieldValue: itemContext.fieldValue,
    horizontalLayout,
    gap
  }
}
