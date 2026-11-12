import { PopoverProps, useAnnounce, useId } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { formatShortDate } from 'pp365-shared-library'
import { useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
import { useRiskActionContext } from '../context'

/** Manages task synchronization, popover visibility and the new-task panel. */
export function useRiskActionPopover() {
  const context = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const panelState = useBoolean(false)
  const popoverState = useBoolean(false)
  const titleId = useId('risk-action-title')
  const [syncError, setSyncError] = useState<string>()
  const { announce } = useAnnounce()

  const onPopoverOpenChange: PopoverProps['onOpenChange'] = (_ev, { open }) => {
    popoverState.setValue(open)
    // A failed sync is told while the popover is open; opened again, it starts clean.
    if (!open) setSyncError(undefined)
  }

  const onOpenPanel = () => {
    popoverState.setFalse()
    panelState.setTrue()
  }

  /** Refreshes stored task references, announcing success or retaining an in-popover error. */
  const onSyncTasks = async () => {
    setSyncError(undefined)
    try {
      const updatedItemContext = await context.dataAdapter.syncTasks(itemContext)
      popoverState.setFalse()
      setItemContext(updatedItemContext)
      announce(strings.RiskActionSyncDone, { polite: true })
    } catch (error) {
      setSyncError(error?.message ?? '')
    }
  }

  let infoText = strings.RiskActionPopoverInfoText
  if (
    stringIsNullOrEmpty(itemContext.hiddenFieldValues?.data) &&
    !stringIsNullOrEmpty(itemContext.fieldValue)
  ) {
    infoText = strings.RiskActionPopoverInfoTextNoPlanner
  }

  const lastUpdated = formatShortDate(itemContext.hiddenFieldValues?.updated, true)

  return {
    titleId,
    syncError,
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
