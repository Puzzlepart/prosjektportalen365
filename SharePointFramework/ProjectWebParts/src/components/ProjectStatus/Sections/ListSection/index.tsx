import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  MessageBarType,
  SelectionMode
} from '@fluentui/react'
import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useEffect, useState } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/index'
import styles from './ListSection.module.scss'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'

function useListSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({ isDataLoaded: false })
  const fetchListData = useFetchListData()
  const showLists = context.state.data.reports
    ? context.state.selectedReport.id === context.state.mostRecentReportId
    : true

  useEffect(() => {
    fetchListData().then((data) => setState({ data, isDataLoaded: false }))
  }, [])

  return { state, showLists } as const
}

export const ListSection: FC = () => {
  const { state, showLists } = useListSection()

  /**
   * Render list
   */
  function renderList() {
    if (!state.isDataLoaded || !state.data) return null
    if (state.error)
      return <UserMessage text={strings.ListSectionDataErrorMessage} type={MessageBarType.error} />
    return (
      <div className={`${styles.list} ms-Grid-col ms-sm12`}>
        <DetailsList
          columns={get<IColumn[]>(state, 'data.columns', [])}
          items={get<any[]>(state, 'data.items', [])}
          selectionMode={SelectionMode.none}
          layoutMode={DetailsListLayoutMode.justified}
        />
      </div>
    )
  }

  return (
    <BaseSection>
      <div className='ms-Grid-row'>
        <div className='ms-Grid-col ms-sm12'>
          <StatusElement />
        </div>
        {showLists && renderList()}
      </div>
    </BaseSection>
  )
}

export * from './types'
