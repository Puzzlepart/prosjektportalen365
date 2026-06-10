import { Tag, tokens } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'

/**
 * Status tag for a raw GtLogStatus value from the archive log.
 * Mirrors the visual style of StatusBadge but handles the four concrete
 * status strings ("Arkivert", "Til arkiv", "Feil", "Advarsel") directly.
 */
export const LogStatusBadge: FC<{ status: string }> = ({ status }) => {
  let icon: JSX.Element
  let backgroundColor: string
  let label: string

  switch (status) {
    case 'Arkivert':
      icon = getFluentIcon('CheckmarkCircle')
      backgroundColor = tokens.colorStatusSuccessBackground2
      label = strings.ArchiveOverview.StatusLabelArchived
      break
    case 'Til arkiv':
      icon = getFluentIcon('ArrowClockwiseDashes')
      backgroundColor = 'rgba(0, 120, 212, 0.12)'
      label = strings.ArchiveOverview.StatusLabelToArchive
      break
    case 'Feil':
      icon = getFluentIcon('ErrorCircle')
      backgroundColor = tokens.colorStatusDangerBackground2
      label = strings.ArchiveOverview.StatusLabelFailed
      break
    case 'Advarsel':
      icon = getFluentIcon('Warning')
      backgroundColor = tokens.colorStatusWarningBackground2
      label = strings.ArchiveOverview.StatusLabelWarning
      break
    default:
      icon = getFluentIcon('LightbulbCircle')
      backgroundColor = tokens.colorNeutralBackground6
      label = status || '–'
  }

  return (
    <Tag icon={icon} style={{ backgroundColor, width: '140px', justifyContent: 'center' }}>
      {label}
    </Tag>
  )
}
