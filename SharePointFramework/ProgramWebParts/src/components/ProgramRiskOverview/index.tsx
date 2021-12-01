import React, { FunctionComponent, useEffect } from 'react'
import { IProgramRiskOverview, SelectedRiskProperties, riskColumns } from './ProgramRiskProps'
import { PortfolioAggregation } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'

export const ProgramRiskOverview: FunctionComponent<IProgramRiskOverview> = (props) => {

  useEffect(() => {

  }, []);

  return (
    <>
      <PortfolioAggregation
        title={props.webPartTitle}
        pageContext={props.context.pageContext}
        dataAdapter={props.dataAdapter}
        showCommandBar={props.properties.showCommandBar}
        showExcelExportButton={props.properties.showExcelExportButton}
        showSearchBox={props.properties.showSearchBox}
        dataSource={props.properties.dataSource}
        columns={props.properties.columns}
        selectProperties={SelectedRiskProperties}
        onUpdateProperty={props.onUpdateProperty}
      />
    </>
  );
}


