import { DataGridList, LoadingSkeleton, createDataGridColumns } from 'pp365-shared-library'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useMemo } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/BaseSection'
import { useListSection } from './useListSection'

export const ListSection: FC = () => {
  const { state, items, columns, summation, shouldRenderList } = useListSection()
  const grid = useMemo(() => createDataGridColumns(columns), [columns])

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
    if (!state.isDataLoaded) return <LoadingSkeleton />
    // The v8 list was justified, so the columns shared the section's width; the shared grid does
    // the same when asked to fit, and carries the list typography the sections are meant to have.
    return <DataGridList items={items} columns={grid.columns} fitColumnsToContainer />
  }

  return (
    <BaseSection>
      <StatusElement summation={summation} />
      {(shouldRenderList || state.error) && renderList()}
    </BaseSection>
  )
}
