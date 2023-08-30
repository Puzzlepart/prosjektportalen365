import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import React, { FC } from 'react'
import styles from './ResourceAllocation.module.scss'
import * as strings from 'PortfolioWebPartsStrings'
import { IResourceAllocationProps } from './types'
import { useResourceAllocation } from './useResourceAllocation'
import { Timeline } from 'pp365-shared-library/lib/components'

export const ResourceAllocation: FC<IResourceAllocationProps> = (props) => {
  const { state, filters, onFilterChange, items, groups } =
    useResourceAllocation(props)

  if (!state.isDataLoaded) return null

  if (state.error) {
    return (
      <FluentProvider className={styles.root} theme={webLightTheme}>
        <div className={styles.errorContainer}>
          <Alert intent='error' >{state.error}</Alert>
        </div>
      </FluentProvider>
    )
  }

  return (
    <FluentProvider className={styles.root} theme={webLightTheme}>
      <Timeline
        title={props.title}
        infoText={strings.ResourceAllocationInfoText}
        groups={groups}
        items={items}
        filters={filters}
        onFilterChange={onFilterChange}
      />
    </FluentProvider>
  )
}

ResourceAllocation.defaultProps = {
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
