import {
  DetailsListLayoutMode,
  SelectionMode,
  Shimmer,
  ShimmeredDetailsList
} from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { OpportunityMatrix } from 'components/OpportunityMatrix'
import { RiskMatrix } from 'components/RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { useProjectStatusContext } from '../../context'
import { BaseSection } from '../BaseSection/BaseSection'
import { useUncertaintySection } from './useUncertaintySection'

export const UncertaintySection: FC = () => {
  const context = useProjectStatusContext()
  const { state, matrixElements, items, columns, shouldRenderContent } = useUncertaintySection()

  /**
   * Render content for the Uncertainty section. Handles potential errors and renders OpportunityMatrix
   * or RiskMatrix based on the content type of the first item in the list.
   */
  function renderContent() {
    if (state.error)
      return (
        <UserMessage
          title={strings.ErrorTitle}
          text={strings.ListSectionDataErrorMessage}
          intent='error'
        />
      )

    let matrix = null
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
          matrix = <OpportunityMatrix {...context.props.opportunityMatrix} items={matrixElements} />
        }
        break
    }
    return (
      <Shimmer isDataLoaded={state.isDataLoaded}>
        {matrix}
        <ShimmeredDetailsList
          styles={{ root: { borderRadius: 10 } }}
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
      {shouldRenderContent && renderContent()}
    </BaseSection>
  )
}
