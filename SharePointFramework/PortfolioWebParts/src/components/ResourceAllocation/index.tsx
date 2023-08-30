import * as strings from 'PortfolioWebPartsStrings'
import { Timeline } from 'pp365-shared-library/lib/components'
import React, { FC } from 'react'
import styles from './ResourceAllocation.module.scss'
import { IResourceAllocationProps } from './types'
import { useResourceAllocation } from './useResourceAllocation'
import { Alert } from '@fluentui/react-components/unstable'

export const ResourceAllocation: FC<IResourceAllocationProps> = (props) => {
  const { state, filters, onFilterChange, items, groups } =
    useResourceAllocation(props)

  if (!state.isDataLoaded) return null

  if (state.error) {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <Alert intent='error'>{state.error}</Alert>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
          <Timeline
            title={props.title}
            infoText={strings.ResourceAllocationInfoText}
            groups={groups}
            items={items}
            filters={filters}
            onFilterChange={onFilterChange}
          />
      </div>
    </div>
  )
}

ResourceAllocation.defaultProps = {
  itemBgColor: '51,153,51',
  itemAbsenceBgColor: '26,111,179',
  defaultTimeStart: [-1, 'months'],
  defaultTimeEnd: [1, 'years'],
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
