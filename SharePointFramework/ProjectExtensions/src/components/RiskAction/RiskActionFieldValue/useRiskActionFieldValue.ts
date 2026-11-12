import { stringIsNullOrEmpty } from '@pnp/core'
import { useRiskActionContext } from '../context'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
import { textBesidesTasks } from '../../../extensions/riskAction/types'

/** Derives displayed tasks, retained action text and layout settings for a risk cell. */
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
