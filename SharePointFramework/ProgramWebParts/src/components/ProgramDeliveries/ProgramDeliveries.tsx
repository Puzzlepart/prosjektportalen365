import React, {FunctionComponent, useEffect} from 'react'
import styles from './ProgramDeliveries.module.scss'
import {IProgramDeliveriesProps} from './ProgramDeliveriesProps'
import {PortfolioAggregation} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { DeliveriesColumns } from './ProgramDeliveriesProps'


export const ProgramDeliveries: FunctionComponent<IProgramDeliveriesProps> = (props) => {

  useEffect(() => {    

  }, []);
    return (
      <>
      <PortfolioAggregation 
      title={props.title}
      pageContext={props.context.pageContext}
      dataAdapter={props.dataAdapter}
      showCommandBar={props.properties.showCommandBar}
      showSearchBox={props.properties.showSearchBox}
      showExcelExportButton={props.properties.showExcelExport}
      dataSource={props.properties.dataSource}
      columns={DeliveriesColumns.columns}
      />
      </>
    );
  
}

