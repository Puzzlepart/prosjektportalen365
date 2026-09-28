import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow
} from '@fluentui/react-components'
import { LoadingSkeleton, createDataGridColumns } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC, ReactElement, useMemo } from 'react'
import { OpportunityMatrix } from '../../../OpportunityMatrix'
import { RiskMatrix } from '../../../RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { useProjectStatusContext } from '../../context'
import { BaseSection } from '../BaseSection/BaseSection'
import { useUncertaintySection } from './useUncertaintySection'

export const UncertaintySection: FC = () => {
  const context = useProjectStatusContext()
  const { state, matrixElements, items, columns, summation, shouldRenderContent } =
    useUncertaintySection()
  const grid = useMemo(() => createDataGridColumns(columns), [columns])

  /**
   * Render content for the Uncertainty section. Handles potential errors and renders OpportunityMatrix
   * or RiskMatrix based on the content type of the first item in the list.
   */
  const renderContent = () => {
    if (state.error)
      return (
        <UserMessage
          title={strings.ErrorTitle}
          text={strings.ListSectionDataErrorMessage}
          intent='error'
        />
      )

    let matrix: ReactElement = null
    switch (state.data.contentTypeIndex) {
      case 1:
        {
          matrix = (
            <RiskMatrix
              {...context.props.riskMatrix}
              pageContext={context.props.pageContext}
              items={matrixElements}
            />
          )
        }
        break
      case 2:
        {
          matrix = (
            <OpportunityMatrix
              {...context.props.opportunityMatrix}
              pageContext={context.props.pageContext}
              items={matrixElements}
            />
          )
        }
        break
    }
    if (!state.isDataLoaded) return <LoadingSkeleton />
    return (
      <>
        {matrix}
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
      </>
    )
  }

  return (
    <BaseSection>
      <StatusElement summation={summation} />
      {(shouldRenderContent || state.error) && renderContent()}
    </BaseSection>
  )
}
