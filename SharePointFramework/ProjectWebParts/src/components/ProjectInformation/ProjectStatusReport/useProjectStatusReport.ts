import { IProjectStatusContext } from '../../ProjectStatus/context'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import _ from 'underscore'
import { ProjectInformationContext } from '../context'

export function useProjectStatusReport() {
  const context = useContext(ProjectInformationContext)
  const selectedReport = _.first(context.state.data.reports)
  if (!selectedReport || context.props.hideStatusReport) return null
  const projectStatusContext: IProjectStatusContext = {
    props: { title: strings.ProjectInformationStatusReportHeaderText },
    state: { ...context.state, selectedReport }
  }
  return projectStatusContext
}
