import {
  DetailsListLayoutMode,
  MessageBarType,
  SelectionMode,
  Shimmer,
  ShimmeredDetailsList
} from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { OpportunityMatrix } from '../../../OpportunityMatrix'
import { RiskMatrix } from '../../../RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { useProjectStatusContext } from '../../context'
import { BaseSection } from '../BaseSection'
import styles from './UncertaintySection.module.scss'
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
      return <UserMessage text={strings.ListSectionDataErrorMessage} type={MessageBarType.error} />

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
        <div className={styles.matrixContainer}>{matrix}</div>
        <div className={styles.listContainer}>
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
        {shouldRenderContent && renderContent()}
      </div>
    </BaseSection>
  )
}
