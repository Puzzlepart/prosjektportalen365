import { stringIsNullOrEmpty } from '@pnp/core'
import { useRiskActionContext } from '../context'

export function useRiskActionFieldValue() {
  const { itemContext } = useRiskActionContext()
  const hiddenFieldValue = itemContext.hiddenFieldValue
  const isFieldValueSet = !stringIsNullOrEmpty(itemContext.fieldValue)
  const isHiddenFieldValueSet = !stringIsNullOrEmpty(hiddenFieldValue?.data)
  return {
    isFieldValueSet,
    isHiddenFieldValueSet,
    tasks: hiddenFieldValue.tasks,
    fieldValue: itemContext.fieldValue
  }
}
