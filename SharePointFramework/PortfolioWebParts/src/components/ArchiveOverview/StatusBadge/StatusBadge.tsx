import { Badge } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { ProjectStatus } from '../useArchiveData'

/**
 * Coloured tint badge reflecting a project's archive status.
 */
export const StatusBadge: FC<{ status: ProjectStatus }> = ({ status }) => {
  if (status === 'updated')
    return (
      <Badge appearance='tint' color='success'>
        {strings.ArchiveOverview.StatusUpdated}
      </Badge>
    )
  if (status === 'warning')
    return (
      <Badge appearance='tint' color='warning'>
        {strings.ArchiveOverview.StatusWarning}
      </Badge>
    )
  return (
    <Badge appearance='tint' color='danger'>
      {strings.ArchiveOverview.StatusNeverArchived}
    </Badge>
  )
}
