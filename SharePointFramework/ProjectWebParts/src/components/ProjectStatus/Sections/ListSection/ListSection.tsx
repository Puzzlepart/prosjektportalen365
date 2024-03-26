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
  const { state, items, columns, summation, shouldRenderList } = useListSection()

  /**
   * Render content for the List section. Handles potential errors and renders the list of items.
   */
  const renderList = () => {
    if (state.error)
      return (
        <UserMessage
          title={strings.ErrorTitle}
          text={strings.ListSectionDataErrorMessage}
          intent='error'
        />
      )
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
      <StatusElement summation={summation} />
      {summation && summation.result !== null && summation.description && (
        <div>
          <strong>{summation.description}</strong>
          <span>{summation.result}</span>
        </div>
      )}
      {shouldRenderList && renderList()}
    </BaseSection>
  )
}
