import {
  DetailsListLayoutMode,
  MessageBarType,
  SelectionMode,
  Shimmer,
  ShimmeredDetailsList
} from '@fluentui/react'
import { OpportunityMatrix } from 'components/OpportunityMatrix'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { RiskMatrix } from '../../../RiskMatrix'
import { ProjectStatusContext } from '../../context'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import styles from './UncertaintySection.module.scss'
import { useUncertaintySection } from './useUncertaintySection'

export const UncertaintySection: FC = () => {
  const context = useContext(ProjectStatusContext)
  const { state, matrixElements, items, columns, shouldRenderContent } = useUncertaintySection()

  /**
   * Render content
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
