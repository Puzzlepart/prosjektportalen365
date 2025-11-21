import strings from 'ProjectWebPartsStrings'
import _ from 'underscore'
import { IProjectStatusContext } from '../../ProjectStatus/context'
import { useProjectInformationContext } from '../context'

/**
 * Returns a project status context object based on the currently
 * selected report in the project information context. The latest report
 * (sorted by created date descending) is selected.
 */
export function useProjectStatusReport() {
  const context = useProjectInformationContext()
  const sortedReports = [...context.state.data.reports].sort((a, b) => b.created.getTime() - a.created.getTime())
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
