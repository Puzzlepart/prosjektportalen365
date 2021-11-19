import React, {FunctionComponent, useEffect} from 'react'
import {IProjectProgramOverviewProps} from './IProgramProjectOverviewProps'
import {PortfolioOverview} from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'

export const ProgramOverview: FunctionComponent<IProjectProgramOverviewProps> = (props) => {

  useEffect(() => {    
  }, []);

    return (
      <>
      <PortfolioOverview 
      title={props.webPartTitle}
      pageContext={props.context.pageContext}
      configuration={props.configuration}
      dataAdapter={props.dataAdapter}
      showCommandBar={true}
      showExcelExportButton={true}
      showFilters={true}
      showViewSelector={true}
      showGroupBy={true}
      showSearchBox={true}
      childSiteIds={props.childProjects}
      isParentProject={true}
      />
      </>
    );
  
}

