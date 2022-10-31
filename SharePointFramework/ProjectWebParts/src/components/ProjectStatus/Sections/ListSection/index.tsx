import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  MessageBarType,
  SelectionMode,
  Shimmer
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/index'
import styles from './ListSection.module.scss'
import { useListSection } from './useListSection'

export const ListSection: FC = () => {
  const { state, showLists } = useListSection()

  /**
   * Render list
   */
  function renderList() {
    if (state.error)
      return <UserMessage text={strings.ListSectionDataErrorMessage} type={MessageBarType.error} />
    return (
      <Shimmer isDataLoaded={state.isDataLoaded}>
        <div className={`${styles.list} ms-Grid-col ms-sm12`}>
          <DetailsList
            columns={get<IColumn[]>(state, 'data.columns', [])}
            items={get<any[]>(state, 'data.items', [])}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.justified}
          />
        </div>
      </Shimmer>
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
