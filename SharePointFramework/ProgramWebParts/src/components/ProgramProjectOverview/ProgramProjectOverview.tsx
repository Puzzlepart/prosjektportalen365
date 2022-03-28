import React, { FunctionComponent } from 'react'
import { IProjectProgramOverviewProps } from './IProgramProjectOverviewProps'
import { PortfolioOverview } from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'

export const ProgramOverview: FunctionComponent<IProjectProgramOverviewProps> = (props) => {
  return (
    <>
      <PortfolioOverview
        title={props.webPartTitle}
        pageContext={props.context.pageContext}
        configuration={props.configuration}
        dataAdapter={props.dataAdapter}
        showCommandBar={props.commandBarProperties.showCommandBar}
        showExcelExportButton={props.commandBarProperties.showExcelExportButton}
        showFilters={props.commandBarProperties.showFilters}
        showViewSelector={props.commandBarProperties.showViewSelector}
        showGroupBy={props.commandBarProperties.showGroupBy}
        showSearchBox={props.commandBarProperties.showSearchBox}
        isParentProject={props.isParentProject}
      />
    </>
  )
}
