import React, { FunctionComponent } from 'react'
import { IProgramDeliveriesProps } from './types'
import { PortfolioAggregation } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'

export const ProgramDeliveries: FunctionComponent<IProgramDeliveriesProps> = (props) => {
  return (
    <PortfolioAggregation
      title={props.webPartTitle}
      pageContext={props.context.pageContext}
      dataAdapter={props.dataAdapter}
      showCommandBar={props.properties.showCommandBar}
      showSearchBox={props.properties.showSearchBox}
      showExcelExportButton={props.properties.showExcelExportButton}
      lockedColumns={false}
      displayMode={props.properties.displayMode}
      onUpdateProperty={props.onUpdateProperty}
      dataSource={props.properties.dataSource}
      columns={props.properties.columns}
      isParent={true}
    />
  )
}
