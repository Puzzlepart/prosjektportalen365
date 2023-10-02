/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { PopoverProps } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../context'
import { useRiskActionContext } from '../context'

/**
 * Custom hook for the `RiskActionPopover` component.
 *
 * @returns An object containing the title, description, onSave function, and tooltipContent for the component.
 */
export function useRiskActionPopover() {
  const context = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const panelState = useBoolean(false)
  const popoverState = useBoolean(false)

  const onPopoverOpenChange: PopoverProps['onOpenChange'] = (_ev, { open }) => {
    popoverState.setValue(open)
  }

  const openPanel = () => {
    popoverState.setFalse()
    panelState.setTrue()
  }

  const updateTasks = async () => {
    const updatedItemContext = await context.dataAdapter.syncTasks(itemContext)
    popoverState.setFalse()
    setItemContext(updatedItemContext)
  }

  let infoText = strings.RiskActionPopoverInfoText
  if (stringIsNullOrEmpty(context.itemContext.hiddenFieldValue?.data)) {
    infoText = strings.RiskActionPopoverInfoTextNoPlanner
  }

  const lastUpdated =
    itemContext.hiddenFieldValue?.updated &&
    new Date(itemContext.hiddenFieldValue.updated).toLocaleString()

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
