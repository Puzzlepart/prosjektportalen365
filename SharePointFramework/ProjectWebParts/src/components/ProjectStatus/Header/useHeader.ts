import { useProjectStatusContext } from '../context'
import strings from 'ProjectWebPartsStrings'

/**
 * Hook that returns the header title for the project status web part.
 *
 * @returns An object containing the header title.
 */
export function useHeader() {
  const context = useProjectStatusContext()
  const title = strings.ProjectInformationStatusReportHeaderText
  const description = context.state?.reportStatus
  return { title, description }
}
