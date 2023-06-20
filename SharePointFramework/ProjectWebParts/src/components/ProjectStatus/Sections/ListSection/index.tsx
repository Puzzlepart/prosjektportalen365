import {
  DetailsListLayoutMode,
  MessageBarType,
  SelectionMode,
  Shimmer,
  ShimmeredDetailsList
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/index'
import styles from './ListSection.module.scss'
import { useListSection } from './useListSection'

export const ListSection: FC = () => {
  const { state, items, columns, shouldRenderList } = useListSection()

  /**
   * Render list
   */
  function renderList() {
    if (state.error)
      return (
        <UserMessage
          text={strings.ListSectionDataErrorMessage}
          type={MessageBarType.error}
        />
      )
    return (
      <Shimmer isDataLoaded={state.isDataLoaded}>
        <div className={styles.list}>
          <ShimmeredDetailsList
            styles={{ root: { borderRadius: 10 } }}
            enableShimmer={!state.isDataLoaded}
            items={items}
            columns={columns}
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
        {shouldRenderList && renderList()}
      </div>
    </BaseSection>
  )
}

export * from './types'
