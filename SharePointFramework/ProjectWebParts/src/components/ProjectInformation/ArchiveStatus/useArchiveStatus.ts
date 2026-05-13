import { getFluentIcon } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { IArchiveScopeStatus } from '../../../data/SPDataAdapter/types'
import { useState } from 'react'
import { useProjectInformationContext } from '../context'
import { PROPERTIES_UPDATED } from '../reducer'
import { useId } from '@fluentui/react-components'

/**
 * Status colors for archive scope statuses
 */
export const ARCHIVE_STATUS_COLORS = {
  [strings.ArchiveLogStatusSuccess]: '#107c10',
  [strings.ArchiveLogStatusError]: '#d13438',
  [strings.ArchiveLogStatusWarning]: '#ffa500',
  [strings.ArchiveLogStatusInProgress]: '#0078d4'
}

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

  const getArchiveStatusIcon = (status: string) => {
    const iconName =
      status === strings.ArchiveLogStatusSuccess
        ? 'CheckmarkCircle'
        : status === strings.ArchiveLogStatusError
        ? 'DismissCircle'
        : status === strings.ArchiveLogStatusWarning
        ? 'Warning'
        : status === strings.ArchiveLogStatusInProgress
        ? 'HourglassHalf'
        : 'HourglassHalf'

    return getFluentIcon(iconName, {
      color: ARCHIVE_STATUS_COLORS[status] || 'inherit',
      size: 20
    })
  }

  const transformScopeItems = (scopes: IArchiveScopeStatus[]) => {
    return scopes.map((scope) => ({
      ...scope,
      icon: getArchiveStatusIcon(scope.status),
      color: ARCHIVE_STATUS_COLORS[scope.status] || 'inherit'
    }))
  }

  const processedOperations =
    archiveInfo?.operations?.map((operation) => ({
      ...operation,
      scopeItems: transformScopeItems(operation.scopes || [])
    })) || []

  /**
   * Aggregate counts per status across all operations + scopes.
   */
  const aggregateCounts = processedOperations.reduce(
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

  const handleOpenChange = (_e: any, data: { open: boolean }) => {
    setOpen(data.open || false)
  }

  const refresh = () => context.dispatch(PROPERTIES_UPDATED({ refetch: true }))

  return {
    archiveInfo,
    processedOperations,
    aggregateCounts,
    intent,
    open,
    fluentProviderId,
    handleOpenChange,
    refresh,
    shouldHide: !context.props.useArchive || isLoading || !archiveInfo
  }
}
