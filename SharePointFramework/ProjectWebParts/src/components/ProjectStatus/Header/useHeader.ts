import { useProjectStatusContext } from '../context'
import strings from 'ProjectWebPartsStrings'
import { getScopeLabel, parseSubProjects } from '../parseSubProjects'

/** Resolves the status report title and description for the selected report series. */
export function useHeader() {
  const context = useProjectStatusContext()
  const scopeLabel = getScopeLabel(
    parseSubProjects(context.props.subProjects),
    context.state.selectedScope
  )
  const title = scopeLabel
    ? `${strings.ProjectInformationStatusReportHeaderText} – ${scopeLabel}`
    : strings.ProjectInformationStatusReportHeaderText
  const description = context.state?.reportStatus
  return { title, description }
}
