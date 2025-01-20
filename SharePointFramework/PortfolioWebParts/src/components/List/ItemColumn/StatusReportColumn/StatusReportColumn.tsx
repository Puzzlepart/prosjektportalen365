import { Icon } from '@fluentui/react/lib/Icon'
import { TooltipDelay, TooltipHost } from '@fluentui/react/lib/Tooltip'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import FadeIn from 'react-fade-in'
import { ColumnRenderComponent } from '../types'
import styles from './StatusColumn.module.scss'
import { IStatusColumnProps } from './types'
import { useStatusReportColumn } from './useStatusReportColumn'
import { fetchData } from './data'

export const StatusReportColumn: ColumnRenderComponent<IStatusColumnProps> = (
  props
): JSX.Element => {
  const { status, tooltipProps } = useStatusReportColumn(props)
  return (
    <TooltipHost
      tooltipProps={tooltipProps}
      delay={TooltipDelay.long}
      closeDelay={TooltipDelay.long}
      calloutProps={{ gapSpace: 10 }}
    >
      <div>
        <FadeIn className={styles.root} delay={100} transitionDuration={400}>
          {status?.sections?.map(({ fieldName, iconName, color }) => (
            <Icon
              key={fieldName}
              iconName={iconName}
              styles={{
                root: {
                  color,
                  paddingRight: 8,
                  fontSize: 20
                }
              }}
            />
          ))}
        </FadeIn>
      </div>
    </TooltipHost>
  )
}
StatusReportColumn.defaultProps = {
  statusReportListName: 'Prosjektstatus',
  columnConfigListName: 'Prosjektkolonnekonfigurasjon',
  statusSectionsListName: 'Statusseksjoner'
}
StatusReportColumn.key = 'statusreport'
StatusReportColumn.id = 'StatusReport'
StatusReportColumn.displayName = strings.ColumnRenderOptionStatusReport
StatusReportColumn.iconName = 'Page'
StatusReportColumn.fetchData = fetchData
