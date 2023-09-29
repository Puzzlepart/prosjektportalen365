/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { stringIsNullOrEmpty } from '@pnp/core'
import { useContext } from 'react'
import { useBoolean } from 'usehooks-ts'
import { RiskActionFieldCustomizerContext } from '../../../context'
import strings from 'ProjectExtensionsStrings'
import { PopoverProps } from '@fluentui/react-components'

/**
 * Custom hook for the `RiskActionPopover` component.
 *
 * @returns An object containing the title, description, onSave function, and tooltipContent for the component.
 */
export function useRiskActionPopover() {
  const context = useContext(RiskActionFieldCustomizerContext)
  const panelState = useBoolean(false)
  const popoverState = useBoolean(false)

  const onPopoverOpenChange: PopoverProps['onOpenChange'] = (_ev, { open }) => {
    popoverState.setValue(open)
  }

  const openPanel = () => {
    popoverState.setFalse()
    panelState.setTrue()
  }

  const updateTasks = () => {
    context.dataAdapter.syncTasks(context)
    popoverState.setFalse()
  }

  let infoText = strings.RiskActionPopoverInfoText
  if (stringIsNullOrEmpty(context.itemContext.hiddenFieldValue?.data)) {
    infoText = strings.RiskActionPopoverInfoTextNoPlanner
  }

  const lastUpdated =
    context.itemContext.hiddenFieldValue?.updated &&
    new Date(context.itemContext.hiddenFieldValue.updated).toLocaleString()

  return {
    updateTasks,
    openPanel,
    closePanel: panelState.setFalse,
    isPanelOpen: panelState.value,
    infoText,
    isPopoverOpen: popoverState.value,
    onPopoverOpenChange,
    lastUpdated
  }
}
