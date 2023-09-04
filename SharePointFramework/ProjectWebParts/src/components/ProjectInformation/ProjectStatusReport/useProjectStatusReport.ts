import strings from 'ProjectWebPartsStrings'
import _ from 'underscore'
import { IProjectStatusContext } from '../../ProjectStatus/context'
import { useProjectInformationContext } from '../context'

export function useProjectStatusReport() {
  const context = useProjectInformationContext()
  const selectedReport = _.first(context.state.data.reports)
  if (!selectedReport || context.props.hideStatusReport) return null
  const projectStatusContext: IProjectStatusContext = {
    props: {
      title: strings.ProjectInformationStatusReportHeaderText,
      description: strings.ProjectInformationStatusReportHeaderDescription
    },
    state: { ...context.state, selectedReport }
  }
  return projectStatusContext
}
