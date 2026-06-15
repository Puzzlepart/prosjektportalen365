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

  const sv = strings.ArchiveOverview
  switch (status) {
    case sv.StatusValueArchived:
      backgroundColor = tokens.colorStatusSuccessBackground2
      label = sv.StatusLabelArchived
      break
    case sv.StatusValueToArchive:
      backgroundColor = 'rgba(0, 120, 212, 0.12)'
      label = sv.StatusLabelToArchive
      break
    case sv.StatusValueFailed:
      backgroundColor = tokens.colorStatusDangerBackground2
      label = sv.StatusLabelFailed
      break
    case sv.StatusValueWarning:
      backgroundColor = tokens.colorStatusWarningBackground2
      label = sv.StatusLabelWarning
      break
    default:
      backgroundColor = tokens.colorNeutralBackground6
      label = status || '–'
  }

  return (
    <Tag icon={icon} style={{ backgroundColor, width: '140px', justifyContent: 'center' }}>
      {label}
    </Tag>
  )
}
