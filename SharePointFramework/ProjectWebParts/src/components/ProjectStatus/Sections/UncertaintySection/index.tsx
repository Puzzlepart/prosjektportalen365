import {
  DetailsListLayoutMode,
  MessageBarType,
  SelectionMode,
  Shimmer,
  ShimmeredDetailsList
} from '@fluentui/react'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectStatusContext } from '../../context'
import { RiskMatrix } from '../../../RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import styles from './UncertaintySection.module.scss'
import { useUncertaintySection } from './useUncertaintySection'

export const UncertaintySection: FC = () => {
  const context = useContext(ProjectStatusContext)
  const { state, riskElements, items, columns, shouldRenderContent } = useUncertaintySection()

  /**
   * Render content
   */
  function renderContent() {
    if (state.error)
      return <UserMessage text={strings.ListSectionDataErrorMessage} type={MessageBarType.error} />
    return (
      <Shimmer isDataLoaded={state.isDataLoaded}>
        <div className={styles.riskMatrix}>
          <RiskMatrix
            {...context.props.riskMatrix}
            pageContext={context.props.pageContext}
            items={riskElements}
          />
        </div>
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
        {shouldRenderContent && renderContent()}
      </div>
    </BaseSection>
  )
}
