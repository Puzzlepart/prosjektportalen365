import { getFluentIcon } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { IArchiveScopeStatus } from '../../../data/SPDataAdapter/types'
import { useState } from 'react'
import { useProjectInformationContext } from '../context'
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

  const handleOpenChange = (e: any, data: { open: boolean }) => {
    setOpen(data.open || false)
  }

  return {
    archiveInfo,
    processedOperations,
    open,
    fluentProviderId,
    handleOpenChange,
    shouldHide: context.props.hideArchiveStatus || isLoading || !archiveInfo
  }
}
