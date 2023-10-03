/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { PopoverProps } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../context'
import { useRiskActionContext } from '../context'

/**
 * Custom hook for the `RiskActionPopover` component.
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

  /**
   * Updates the tasks in the item context by syncing with the data adapter, sets the updated item context,
   * and closes the popover.
   */
  const updateTasks = async () => {
    const updatedItemContext = await context.dataAdapter.syncTasks(itemContext)
    popoverState.setFalse()
    setItemContext(updatedItemContext)
  }

  let infoText = strings.RiskActionPopoverInfoText
  if (
    stringIsNullOrEmpty(itemContext.hiddenFieldValue?.data) &&
    !stringIsNullOrEmpty(itemContext.fieldValue)
  ) {
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
    lastUpdated,
    itemContext,
    showLastSyncTime: context.dataAdapter.globalSettings.get('RiskActionPlannerShowLastSyncTime') === '1'
  }
}
