import React, { FunctionComponent } from 'react'
import { IProgramTimelineProps } from 'webparts/programTimeline/ProgramTimelineWebPart'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/index'

export const ProgramTimeline: FunctionComponent<IProgramTimelineProps> = (props) => {

  return (
    <>
      <ProjectTimeline
        title="Tidslinje"
        dataSource={"Prosjekttidslinje"}
        dataAdapter={props.dataAdapter}
        pageContext={props.context.pageContext as any}
      />
    </>
  )
}
