import { format } from '@fluentui/react'
import { formatDate } from 'pp365-shared-library/lib/util'
import strings from 'ProjectWebPartsStrings'
import _ from 'underscore'
import { IProjectStatusContext } from '../../ProjectStatus/context'
import { useProjectInformationContext } from '../context'

/**
 * Returns a project status context object based on the currently
 * selected report in the project information context.
 */
export function useProjectStatusReport() {
  const context = useProjectInformationContext()
  const selectedReport = _.first(context.state.data.reports)
  if (!selectedReport || context.props.hideStatusReport) return null

  const reportStatus = selectedReport.published
    ? format(strings.PublishedStatusReport, formatDate(selectedReport.publishedDate))
    : format(strings.NotPublishedStatusReport, formatDate(selectedReport.modified))

  const projectStatusContext: IProjectStatusContext = {
    props: {
      title: strings.ProjectInformationStatusReportHeaderText,
      description: strings.ProjectInformationStatusReportHeaderDescription
    },
    state: { ..._.omit(context.state, 'activePanel'), selectedReport, reportStatus }
  }
  return projectStatusContext
}
