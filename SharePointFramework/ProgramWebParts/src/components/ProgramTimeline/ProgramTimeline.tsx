import React, { FunctionComponent } from 'react'
// import { IProgramTimelineProps } from './Types'
import { IProgramTimelineProps } from 'webparts/programTimeline/ProgramTimelineWebPart'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/index'
// import styles from './ProgramTimelineProps.module.scss'
// import {PortfolioOverview} from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'

export const ProgramTimeline: FunctionComponent<IProgramTimelineProps> = (props) => {
  
  return (
    <>
      <ProjectTimeline
        title="Tidslinje"
        dataSource={"test"}
        dataAdapter={props.dataAdapter}
        pageContext={props.context.pageContext as any}
        displayMode={1}
      />
    </>
  )
}
