import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import styles from './StatusColumn.module.scss'
import { IStatusColumnProps } from './types'
import { useStatusReportColumn } from './useStatusReportColumn'
import { fetchData } from './data'
import resource from 'SharedResources'
import {
  ColumnRenderComponent,
  getFluentIconWithFallback,
  StatusMark,
  withDefaults
} from 'pp365-shared-library'
import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import { TooltipContent } from './TooltipContent'

/** Read by `fetchData` too, which merges the column's own settings over them. */
export const STATUS_REPORT_COLUMN_DEFAULT_PROPS: Partial<IStatusColumnProps> = {
  statusReportListName: resource.Lists_ProjectStatus_Title,
  columnConfigListName: resource.Lists_ProjectColumnConfiguration_Title,
  statusSectionsListName: resource.Lists_StatusSections_Title,
  openDelay: 500,
  tooltip: {
    animation: {
      delay: 50,
      transitionDuration: 200
    }
  }
}

export const StatusReportColumn: ColumnRenderComponent<IStatusColumnProps> = (
  incomingProps
): JSX.Element => {
  const props = withDefaults(incomingProps, STATUS_REPORT_COLUMN_DEFAULT_PROPS)
  const { status, label, open, onOpenChange, cancelPendingOpen } = useStatusReportColumn(props)
  // No report, nothing to show: the trigger was an empty button.
  if (!label) return null

  return (
    <Popover
      withArrow
      positioning='below'
      mouseLeaveDelay={200}
      openOnHover
      open={open}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger disableButtonEnhancement>
        <div className={styles.root} aria-label={label} onPointerLeave={cancelPendingOpen}>
          {status?.sections?.map(({ fieldName, iconName, color, statusIconName }) => (
            <span key={fieldName} className={styles.icon} style={{ color }}>
              {getFluentIconWithFallback(iconName, { color })}
              <StatusMark color={color} iconName={statusIconName} />
            </span>
          ))}
        </div>
      </PopoverTrigger>
      <PopoverSurface className={styles.popoverSurface}>
        <TooltipContent status={status} animation={props.tooltip.animation} />
      </PopoverSurface>
    </Popover>
  )
}
StatusReportColumn.key = 'statusreport'
StatusReportColumn.id = 'StatusReport'
StatusReportColumn.displayName = strings.ColumnRenderOptionStatusReport
StatusReportColumn.iconName = 'Page'
StatusReportColumn.fetchData = fetchData
