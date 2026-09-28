import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow
} from '@fluentui/react-components'
import { LoadingSkeleton, createDataGridColumns } from 'pp365-shared-library'
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
    return (
      <DataGrid
        items={items}
        columns={grid.columns}
        columnSizingOptions={grid.columnSizingOptions}
        resizableColumns
      >
      <DataGridHeader>
        <DataGridRow>
            {({ renderHeaderCell }) => (
            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
      <DataGridBody>
          {({ item, rowId }) => (
          <DataGridRow key={rowId}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    )
  }

  return (
    <BaseSection>
      <StatusElement summation={summation} />
      {(shouldRenderList || state.error) && renderList()}
    </BaseSection>
  )
}
