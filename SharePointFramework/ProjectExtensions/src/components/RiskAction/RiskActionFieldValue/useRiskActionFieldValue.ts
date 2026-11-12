import { stringIsNullOrEmpty } from '@pnp/core'
import type { KeyboardEvent } from 'react'
import { useRiskActionContext } from '../context'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
import { textBesidesTasks } from '../../../extensions/riskAction/types'

/**
 * Keeps Enter and Space in the cell from the list's row: SharePoint opened the item's display form
 * on Enter on the cell's button, and selected the row on Space, besides opening the actions (WCAG
 * 2.1.1). The button still acts on them, as it does on a click, which the row ignores.
 *
 * @param event A key pressed or let go in the cell
 */
export function stopRowKeys(event: KeyboardEvent<HTMLElement>): void {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}

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
    gap,
    onKeyDown: stopRowKeys,
    onKeyUp: stopRowKeys
  }
}
