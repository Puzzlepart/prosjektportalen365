import { DetailsList, DetailsListLayoutMode, MessageBarType, SelectionMode } from '@fluentui/react'
import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { RiskMatrix } from '../../../RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import styles from './RiskSection.module.scss'
import { useRiskSection } from './useRiskSection'

export const RiskSection: FC = () => {
  const context = useContext(ProjectStatusContext)
  const { state, showLists } = useRiskSection()

  /**
   * Render content
   */
  function renderContent() {
    if (state.loading || !state.data) return null
    if (state.error)
      return <UserMessage text={strings.ListSectionDataErrorMessage} type={MessageBarType.error} />
    return (
      <div>
        <div className='ms-Grid-col ms-sm12'>
          <RiskMatrix
            width={context.props.riskMatrixWidth}
            height={context.props.riskMatrixHeight}
            calloutTemplate={context.props.riskMatrixCalloutTemplate}
            pageContext={context.props.pageContext}
            items={state.data.riskElements}
          />
        </div>
        <div className={`${styles.list} ms-Grid-col ms-sm12`}>
          <DetailsList
            columns={state.data.columns}
            items={state.data.items}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.justified}
          />
        </div>
      </div>
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
