import * as strings from 'ProjectWebPartsStrings'
import { useState } from 'react'
import { useProjectInformationContext } from '../context'
import { PROPERTIES_UPDATED } from '../reducer'
import { useId } from '@fluentui/react-components'

/**
 * Component logic hook for `ArchiveStatus`.
 *
 * @returns Archive status data
 */
export function useArchiveStatus() {
  const context = useProjectInformationContext()
  const [open, setOpen] = useState(false)
  const fluentProviderId = useId('fp-archive-status')

  const archiveInfo = context.state.data?.archiveStatus
  const isLoading = !context.state.data

  const operations = archiveInfo?.operations ?? []

  /**
   * Aggregate counts per status across all operations + scopes.
   */
  const aggregateCounts = operations.reduce(
    (acc, op) => {
      op.scopes.forEach((s) => {
        if (s.status === strings.ArchiveLogStatusSuccess) acc.success += s.count
        else if (s.status === strings.ArchiveLogStatusError) acc.error += s.count
        else if (s.status === strings.ArchiveLogStatusWarning) acc.warning += s.count
        else if (s.status === strings.ArchiveLogStatusInProgress) acc.pending += s.count
      })
      return acc
    },
    { success: 0, error: 0, warning: 0, pending: 0 }
  )

  const intent: 'info' | 'warning' | 'error' =
    aggregateCounts.error > 0 ? 'error' : aggregateCounts.warning > 0 ? 'warning' : 'info'

  const handleOpenChange = (_e: unknown, data: { open: boolean }) => {
    setOpen(data.open || false)
  }

  const refresh = () => context.dispatch(PROPERTIES_UPDATED({ refetch: true }))

  return {
    archiveInfo,
    operations,
    aggregateCounts,
    intent,
    open,
    fluentProviderId,
    handleOpenChange,
    refresh,
    shouldHide: !context.props.useArchive || isLoading || !archiveInfo
  }
}
