import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  MessageBarType,
  SelectionMode,
  Shimmer
} from '@fluentui/react'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { RiskElementModel, RiskMatrix } from '../../../RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import styles from './RiskSection.module.scss'
import { useRiskSection } from './useRiskSection'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'

export const RiskSection: FC = () => {
  const context = useContext(ProjectStatusContext)
  const { state, showLists } = useRiskSection()

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
            width={context.props.riskMatrixFullWidth ? '100%' : context.props.riskMatrixWidth}
            height={context.props.riskMatrixHeight}
            calloutTemplate={context.props.riskMatrixCalloutTemplate}
            size={context.props.riskMatrixSize}
            colorScaleConfig={context.props.riskMatrixColorScaleConfig}
            pageContext={context.props.pageContext}
            items={get<RiskElementModel[]>(state, 'data.riskElements', [])}
          />
        </div>
        <div className={styles.list}>
          <DetailsList
            columns={get<IColumn[]>(state, 'data.columns', [])}
            items={get<any[]>(state, 'data.items', [])}
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
        {showLists && renderContent()}
      </div>
    </BaseSection>
  )
}
