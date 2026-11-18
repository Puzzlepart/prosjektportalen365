import { PopoverProps, useAnnounce, useId } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { formatShortDate, useFocusContentProps } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect, useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../extensions/riskAction/context'
import { useRiskActionContext } from '../context'

/** How long after the popover has closed the sync is told: time for the focus to reach its link. */
export const SYNC_DONE_DELAY = 300

/** Manages task synchronization, popover visibility and the new-task panel. */
export function useRiskActionPopover() {
  const context = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const panelState = useBoolean(false)
  const popoverState = useBoolean(false)
  const titleId = useId('risk-action-title')
  const [syncError, setSyncError] = useState<string>()
  const { announce } = useAnnounce()
  const telemetry = useTelemetry()
  const [syncDone, setSyncDone] = useState(false)

  // Told once the popover has closed and given the focus back to its link: told as it closed, the
  // screen reader began «Oppgavestatusen er oppdatert» and broke off to read the link
  // (Puzzlepart/prosjektportalen365-testing#136). A polite message then waits for the link.
  useEffect(() => {
    if (!syncDone || popoverState.value) return undefined
    const timer = window.setTimeout(() => {
      announce(strings.RiskActionSyncDone, { polite: true })
      setSyncDone(false)
    }, SYNC_DONE_DELAY)
    return () => window.clearTimeout(timer)
  }, [syncDone, popoverState.value])

  const onPopoverOpenChange: PopoverProps['onOpenChange'] = (_ev, { open }) => {
    popoverState.setValue(open)
    // A failed sync is told while the popover is open; opened again, it starts clean.
    if (!open) setSyncError(undefined)
  }

  const onOpenPanel = () => {
    popoverState.setFalse()
    panelState.setTrue()
  }

  /**
   * Refreshes stored task references, announcing success or retaining an in-popover error, which
   * usage statistics count by its error's code.
   */
  const onSyncTasks = async () => {
    setSyncError(undefined)
    try {
      const updatedItemContext = await context.dataAdapter.syncTasks(itemContext)
      popoverState.setFalse()
      setItemContext(updatedItemContext)
      setSyncDone(true)
    } catch (error) {
      telemetry.trackError(error)
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

  // It starts with its title and texts: it opens with the focus on its content, not on its first
  // action (Puzzlepart/prosjektportalen365-testing#132).
  const focusContent = useFocusContentProps()

  return {
    focusContent,
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
