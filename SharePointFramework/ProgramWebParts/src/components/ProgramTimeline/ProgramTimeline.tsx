import React, { FunctionComponent } from 'react'
import { IProgramTimelineProps } from 'webparts/programTimeline/ProgramTimelineWebPart'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/index'

export const ProgramTimeline: FunctionComponent<IProgramTimelineProps> = (props) => {

  return (
    <>
      <ProjectTimeline
        title={props.webPartTitle}
        dataSource={props.dataSource}
        dataAdapter={props.dataAdapter}
        pageContext={props.context.pageContext as any}
        infoText={props?.infoText}
      />
    </>
  )
}
