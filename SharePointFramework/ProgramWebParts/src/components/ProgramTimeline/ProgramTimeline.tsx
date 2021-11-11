import React, { FunctionComponent, useEffect } from 'react'
// import { IProgramTimelineProps } from './Types'
import { IProgramTimelineProps } from 'webparts/programTimeline/ProgramTimelineWebPart'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline'
// import styles from './ProgramTimelineProps.module.scss'
// import {PortfolioOverview} from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'

export const ProgramTimeline: FunctionComponent<IProgramTimelineProps> = (props) => {
  useEffect(() => {}, [])
  console.log(props);
  
  return (
    <>
      <ProjectTimeline 
      dataSource={"Tidslinjeinnhold"}
      defaultTimeStart={[-1, 'months']}/>
    </>
  )
}
