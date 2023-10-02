import { stringIsNullOrEmpty } from '@pnp/core'
import { useRiskActionContext } from '../context'

/**
 * Custom hook that returns the field value and hidden field value for a risk action item.
 */
export function useRiskActionFieldValue() {
  const { itemContext } = useRiskActionContext()
  const hiddenFieldValue = itemContext.hiddenFieldValue
  const isFieldValueSet = !stringIsNullOrEmpty(itemContext.fieldValue)
  const isHiddenFieldValueSet = !stringIsNullOrEmpty(hiddenFieldValue?.data)
  return {
    isFieldValueSet,
    isHiddenFieldValueSet,
    tasks: hiddenFieldValue?.tasks ?? [],
    fieldValue: itemContext.fieldValue
  }
}
