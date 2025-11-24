import strings from 'ProjectWebPartsStrings'
import _ from 'underscore'
import { IProjectStatusContext } from '../../ProjectStatus/context'
import { useProjectInformationContext } from '../context'

/**
 * Returns a project status context object based on the currently
 * selected report in the project information context. The latest published report
 * (sorted by published date descending) is selected.
 */
export function useProjectStatusReport() {
  const context = useProjectInformationContext()
  const publishedReports = context.state.data.reports.filter((report) => report.published)
  const sortedReports = [...publishedReports].sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime())
  const selectedReport = _.first(sortedReports)
  if (!selectedReport || context.props.hideStatusReport) return null
  const projectStatusContext: IProjectStatusContext = {
    props: {
      title: strings.ProjectInformationStatusReportHeaderText,
      description: strings.ProjectInformationStatusReportHeaderDescription
    },
    state: { ..._.omit(context.state, 'activePanel'), selectedReport }
  }
  return projectStatusContext
}
