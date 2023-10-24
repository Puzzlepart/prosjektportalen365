import {
  DetailsListLayoutMode,
  SelectionMode,
  Shimmer,
  ShimmeredDetailsList
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/BaseSection'
import { useListSection } from './useListSection'

export const ListSection: FC = () => {
  const { state, items, columns, shouldRenderList } = useListSection()

  /**
   * Render list
   */
  function renderList() {
    if (state.error)
      return <UserMessage text={strings.ListSectionDataErrorMessage} intent='error' />
    return (
      <Shimmer isDataLoaded={state.isDataLoaded}>
        <ShimmeredDetailsList
          enableShimmer={!state.isDataLoaded}
          items={items}
          columns={columns}
          selectionMode={SelectionMode.none}
          layoutMode={DetailsListLayoutMode.justified}
        />
      </Shimmer>
    )
  }

  return (
    <BaseSection>
      <StatusElement />
      {shouldRenderList && renderList()}
    </BaseSection>
  )
}
