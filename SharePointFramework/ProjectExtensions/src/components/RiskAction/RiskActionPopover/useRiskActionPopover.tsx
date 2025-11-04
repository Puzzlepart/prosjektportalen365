/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { PopoverProps } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
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

  const onOpenPanel = () => {
    popoverState.setFalse()
    panelState.setTrue()
  }

  /**
   * Syncs the tasks in the item context by syncing with the data adapter, sets the updated item context,
   * and closes the popover.
   */
  const onSyncTasks = async () => {
    const updatedItemContext = await context.dataAdapter.syncTasks(itemContext)
    popoverState.setFalse()
    setItemContext(updatedItemContext)
  }

  let infoText = strings.RiskActionPopoverInfoText
  if (
    stringIsNullOrEmpty(itemContext.hiddenFieldValues?.data) &&
    !stringIsNullOrEmpty(itemContext.fieldValue)
  ) {
    infoText = strings.RiskActionPopoverInfoTextNoPlanner
  }

  const lastUpdated =
    itemContext.hiddenFieldValues?.updated &&
    new Date(itemContext.hiddenFieldValues.updated).toLocaleString()

  return {
    infoText,
    isPopoverOpen: popoverState.value,
    onPopoverOpenChange,
    onSyncTasks,
    onOpenPanel,
    onClosePanel: panelState.setFalse,
    isPanelOpen: panelState.value,
    lastUpdated,
    itemContext,
    showLastSyncTime:
      context.dataAdapter.globalSettings.get('RiskActionPlannerShowLastSyncTime') === '1'
  }
}
