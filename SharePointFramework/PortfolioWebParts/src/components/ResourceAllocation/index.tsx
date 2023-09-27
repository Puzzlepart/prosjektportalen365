import { Alert } from '@fluentui/react-components/unstable'
import * as strings from 'PortfolioWebPartsStrings'
import { Themed, Timeline } from 'pp365-shared-library/lib/components'
import React, { FC } from 'react'
import styles from './ResourceAllocation.module.scss'
import { IResourceAllocationProps } from './types'
import { useResourceAllocation } from './useResourceAllocation'

export const ResourceAllocation: FC<IResourceAllocationProps> = (props) => {
  const { state, filters, onFilterChange, items, groups, defaultTimeframe } =
    useResourceAllocation(props)

  if (!state.isDataLoaded) return null

  if (state.error) {
    return (
      <Themed className={styles.root}>
        <div className={styles.errorContainer}>
          <Alert intent='error'>{state.error}</Alert>
        </div>
      </Themed>
    )
  }

  return (
    <Themed className={styles.root}>
      <Timeline
        title={props.title}
        infoText={strings.ResourceAllocationInfoText}
        defaultTimeframe={defaultTimeframe}
        groups={groups}
        items={items}
        filters={filters}
        onFilterChange={onFilterChange}
      />
    </Themed>
  )
}

ResourceAllocation.defaultProps = {
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
    'GtResourceLoadOWSNMBR',
    'GtResourceAbsenceOWSCHCS',
    'GtStartDateOWSDATE',
    'GtEndDateOWSDATE',
    'GtAllocationStatusOWSCHCS',
    'GtAllocationCommentOWSMTXT'
  ]
}

export * from './types'
