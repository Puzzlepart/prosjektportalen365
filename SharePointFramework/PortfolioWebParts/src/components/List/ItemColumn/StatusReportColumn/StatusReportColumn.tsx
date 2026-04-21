import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import styles from './StatusColumn.module.scss'
import { IStatusColumnProps } from './types'
import { useStatusReportColumn } from './useStatusReportColumn'
import { fetchData } from './data'
import resource from 'SharedResources'
import {
  ColumnRenderComponent,
  customLightTheme,
  getFluentIconWithFallback
} from 'pp365-shared-library'
import {
  FluentProvider,
  IdPrefixProvider,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  useId
} from '@fluentui/react-components'
import { TooltipContent } from './TooltipContent'

export const StatusReportColumn: ColumnRenderComponent<IStatusColumnProps> = (
  props
): JSX.Element => {
  const { status } = useStatusReportColumn(props)
  const fluentProviderId = useId('fp-status-report-column')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider
        theme={customLightTheme}
        style={{ display: 'inline', backgroundColor: 'transparent' }}
      >
        <Popover withArrow positioning='below' mouseLeaveDelay={200} openOnHover>
          <PopoverTrigger disableButtonEnhancement>
            <div className={styles.root}>
              {status?.sections?.map(({ fieldName, iconName, color }, idx) => (
                <span
                  key={fieldName}
                  className={styles.icon}
                  style={{
                    color,
                    animationDelay: `${idx * props.animation.delay}ms`
                  }}
                >
                  {getFluentIconWithFallback(iconName, true, color)}
                </span>
              ))}
            </div>
          </PopoverTrigger>
          <PopoverSurface className={styles.popoverSurface}>
            <TooltipContent status={status} animation={props.tooltip.animation} />
          </PopoverSurface>
        </Popover>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
StatusReportColumn.defaultProps = {
  statusReportListName: resource.Lists_ProjectStatus_Title,
  columnConfigListName: resource.Lists_ProjectColumnConfiguration_Title,
  statusSectionsListName: resource.Lists_StatusSections_Title,
  animation: {
    delay: 100,
    transitionDuration: 250
  },
  tooltip: {
    animation: {
      delay: 50,
      transitionDuration: 200
    }
  }
}
StatusReportColumn.key = 'statusreport'
StatusReportColumn.id = 'StatusReport'
StatusReportColumn.displayName = strings.ColumnRenderOptionStatusReport
StatusReportColumn.iconName = 'Page'
StatusReportColumn.fetchData = fetchData
