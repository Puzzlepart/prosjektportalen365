import React, {FunctionComponent, useEffect} from 'react'
import {IProgramDeliveriesProps} from './ProgramDeliveriesProps'
import {PortfolioAggregation} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'


export const ProgramDeliveries: FunctionComponent<IProgramDeliveriesProps> = (props) => {

  useEffect(() => {    
    console.log(props.properties.columns)
  }, []);
    return (
      <PortfolioAggregation 
      title={props.title}
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
    );
  
}

