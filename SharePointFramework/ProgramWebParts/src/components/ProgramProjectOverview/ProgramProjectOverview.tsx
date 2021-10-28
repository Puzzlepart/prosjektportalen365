import React, {FunctionComponent, useEffect} from 'react'
import styles from './ProgramProjectOverview.module.scss'
import {IProjectProgramOverviewProps} from './IProgramProjectOverviewProps'
import {PortfolioOverview} from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'
import {sp} from '@pnp/sp'

export const ProgramOverview: FunctionComponent<IProjectProgramOverviewProps> = (props) => {

  useEffect(() => {
    
  }, []);

  console.log('render');
    return (
      <>
      <PortfolioOverview 
      title={"Programoversikt"}
      pageContext={props.context.pageContext}
      configuration={props.configuration}
      dataAdapter={props.dataAdapt}
      showCommandBar={true}
      showExcelExportButton={true}
      showFilters={true}
      showViewSelector={true}
      showGroupBy={true}
      showSearchBox={true}
      />
      </>
    );
  
}