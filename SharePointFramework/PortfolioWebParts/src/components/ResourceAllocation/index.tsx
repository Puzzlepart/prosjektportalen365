import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './ResourceAllocation.module.scss'
import * as strings from 'PortfolioWebPartsStrings'
import { IResourceAllocationProps } from './types'
import { useResourceAllocation } from './useResourceAllocation'
import { LoadingSkeleton, Timeline, UserMessage, customLightTheme } from 'pp365-shared-library'
import resource from 'SharedResources'
import { format } from '@fluentui/react'

export const ResourceAllocation: FC<IResourceAllocationProps> = (props) => {
  const { state, filters, onFilterChange, items, groups, defaultTimeframe, fluentProviderId } =
    useResourceAllocation(props)

  if (state.error) {
    return (
      <FluentProvider className={styles.root} theme={customLightTheme}>
        <div className={styles.errorContainer}>
          <UserMessage title={strings.ErrorTitle} text={state.error} intent='error' />
        </div>
      </FluentProvider>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider className={styles.root} theme={customLightTheme}>
        {state.loading ? (
          <LoadingSkeleton />
        ) : (
          <Timeline
            title={props.title}
            infoText={format(strings.ResourceAllocationInfoText, resource.Lists_ResourceAllocation_Url)}
            defaultTimeframe={defaultTimeframe}
            groups={groups}
            items={items}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        )}
      </FluentProvider>
    </IdPrefixProvider>
  )
}

ResourceAllocation.defaultProps = {
  dataSource: resource.Lists_DataSources_Category_ResourceAllocation_All,
  defaultTimeframeStart: '4,months',
  defaultTimeframeEnd: '4,months',
  itemColor: '51,153,51',
  itemAbsenceColor: '26,111,179',
  selectProperties: [
    'Path',
    'SPWebUrl',
    'ContentTypeId',
    'SiteTitle',
    'SiteName',
    'RefinableString71',
    'RefinableString72',
    'GtResourceUserOWSUSER',
    'GtResourceLoadOWSNMBR',
    'GtResourceAbsenceOWSCHCS',
    'GtStartDateOWSDATE',
    'GtEndDateOWSDATE',
    'GtAllocationStatusOWSCHCS',
    'GtAllocationCommentOWSMTXT'
  ]
}

export * from './types'
