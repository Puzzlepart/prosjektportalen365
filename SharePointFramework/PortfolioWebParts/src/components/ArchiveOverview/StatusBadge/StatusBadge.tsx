import { Tag, tokens } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { ProjectStatus } from '../useArchiveData'

/**
 * Status tag for a project's archive status, styled to match the
 * ProvisionStatus component: icon + semantic background colour via design tokens.
 */
export const StatusBadge: FC<{ status: ProjectStatus }> = ({ status }) => {
  let icon: JSX.Element
  let backgroundColor: string
  let label: string

  switch (status) {
    case 'updated':
      backgroundColor = tokens.colorStatusSuccessBackground2
      label = strings.ArchiveOverview.StatusUpdated
      break
    case 'warning':
      backgroundColor = tokens.colorStatusWarningBackground2
      label = strings.ArchiveOverview.StatusWarning
      break
    default:
      backgroundColor = tokens.colorStatusDangerBackground2
      label = strings.ArchiveOverview.StatusNeverArchived
  }

  return (
    <Tag style={{ backgroundColor, width: '140px', justifyContent: 'center' }}>
      {label}
    </Tag>
  )
}
