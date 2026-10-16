import React, { FC } from 'react'
import { ProjectStatusContext, SummarySection, Header } from '../../ProjectStatus'
import { useProjectInformationContext } from '../context'
import { useProjectStatusReport } from './useProjectStatusReport'

export const ProjectStatusReport: FC = () => {
  const context = useProjectInformationContext()
  const projectStatusContexts = useProjectStatusReport()
  if (projectStatusContexts.length === 0) return null
  return (
    <div>
      {projectStatusContexts.map((projectStatusContext) => (
        <ProjectStatusContext.Provider
          key={projectStatusContext.state.selectedReport.id}
          value={projectStatusContext}
        >
          <Header />
          <SummarySection
            transparent
            noPadding
            noMargin
            iconsOnly={context.props.statusReportShowOnlyIcons}
            // The icons' own 20 px grid: crisp, where 18 px blurred their strokes.
            iconSize={20}
            truncateComment={context.props.statusReportTruncateComments}
          />
        </ProjectStatusContext.Provider>
      ))}
    </div>
  )
}
