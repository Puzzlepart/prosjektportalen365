import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderComponent, withDefaults } from 'pp365-shared-library'
import { switchField } from 'pp365-shared-library/lib/components/ItemColumn/ColumnDataTypeField'
import React from 'react'
import { fetchData, getStatusReportColumnData } from './data'
import { STATUS_REPORT_COLUMN_DEFAULT_PROPS } from './defaults'
import styles from './StatusColumn.module.scss'
import { StatusReportDetails } from './StatusReportDetails'
import { StatusReportLegend } from './StatusReportLegend'
import { StatusTile } from './StatusTile'
import { IStatusColumnProps } from './types'
import { useStatusReportColumn } from './useStatusReportColumn'

/** A tile's 20 px track and the 2 px gap after it. */
const TILE_PITCH = 22

/** The strip's margin, border and padding on both sides (8 px), less the last tile's gap. */
const STRIP_EDGES = 6

/**
 * The row's latest status report as a strip of tiles, one for each status section in the hub's
 * order, each with its value's shape on a light tone of its colour, and the date beside it where
 * the room beside the strip fits it. The strip is a button named by the date and a count of each
 * colour, and described by every section's value; it opens the report's details, as a preview
 * while the pointer rests on it and as a dialog on a click or a key, and is expanded only while
 * the dialog it announces is open. «Ingen publisert rapport» where the hub's data is in and the
 * row is the configured hub's (in a merged view too) with no published report; nothing where the
 * data is not (the program's views, a failed fetch) or the row is another hub's.
 */
export const StatusReportColumn: ColumnRenderComponent<IStatusColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, STATUS_REPORT_COLUMN_DEFAULT_PROPS)
  const {
    report,
    noReport,
    name,
    description,
    date,
    descriptionId,
    triggerRef,
    pinned,
    stripStyle,
    cancelPendingOpen,
    popover,
    surface,
    details
  } = useStatusReportColumn(props)
  if (noReport) return <span className={styles.none}>{strings.StatusReportNone}</span>
  if (!report) return null

  return (
    <div className={styles.root}>
      <Popover {...popover}>
        <PopoverTrigger disableButtonEnhancement>
          <button
            ref={triggerRef}
            type='button'
            className={styles.strip}
            style={stripStyle}
            aria-label={name}
            aria-describedby={descriptionId}
            aria-haspopup='dialog'
            aria-expanded={pinned}
            data-pinned={pinned || undefined}
            onPointerLeave={cancelPendingOpen}
          >
            {report.sections.map((section) => (
              <StatusTile key={section.fieldName} shape={section.shape} color={section.color} />
            ))}
          </button>
        </PopoverTrigger>
        <PopoverSurface {...surface}>
          <StatusReportDetails {...details} />
        </PopoverSurface>
      </Popover>
      <span className={styles.dateBox} aria-hidden>
        <span className={styles.date}>{date}</span>
      </span>
      <span id={descriptionId} hidden>
        {description}
      </span>
    </div>
  )
}
StatusReportColumn.key = 'statusreport'
StatusReportColumn.id = 'StatusReport'
StatusReportColumn.displayName = strings.ColumnRenderOptionStatusReport
StatusReportColumn.iconName = 'Page'
StatusReportColumn.fetchData = fetchData
StatusReportColumn.getDataTypeProperties = (onChange, dataTypeProperties) => [
  switchField({
    label: strings.StatusReportOpenOnHoverLabel,
    checked: dataTypeProperties?.openOnHover ?? true,
    onChange: (checked) => onChange('openOnHover', checked)
  })
]
StatusReportColumn.getMinWidth = (column) => {
  const count = getStatusReportColumnData(column)?.sections.length
  return count ? STRIP_EDGES + TILE_PITCH * count : undefined
}
StatusReportColumn.renderHeaderAddon = (column) => {
  const sections = getStatusReportColumnData(column)?.sections
  return sections?.length ? <StatusReportLegend sections={sections} /> : null
}
