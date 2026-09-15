import { useProjectStatusContext } from '../context'
import strings from 'ProjectWebPartsStrings'
import { getScopeLabel, parseSubProjects } from '../parseSubProjects'

/**
 * Hook that returns the header title for the project status web part. When a
 * report scope ("delprosjekt") is selected, its label is appended to the
 * title so the user sees which report series they are viewing.
 *
 * @returns An object containing the header title.
 */
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
