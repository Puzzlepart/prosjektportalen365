import { stringIsNullOrEmpty } from '@pnp/core'
import { SectionModel, SectionType, StatusReport } from 'pp365-shared-library/lib/models'
import { IProjectInformationData } from 'pp365-shared-library'
import { useProjectStatusContext } from '../context'

/**
 * Check if a section has any content worth displaying.
 *
 * @param section Section model
 * @param selectedReport Currently selected status report
 * @param properties Project properties data
 */
function sectionHasContent(
  section: SectionModel,
  selectedReport: StatusReport,
  properties: IProjectInformationData
): boolean {
  const { value, comment } = selectedReport?.getStatusValue(section.fieldName) ?? {}
  if (!stringIsNullOrEmpty(value) || !stringIsNullOrEmpty(comment)) return true

  if (section.type === SectionType.ProjectPropertiesSection && section.viewFields?.length > 0) {
    const fieldValuesAsText = {
      ...properties?.fieldValues?.['_fieldValuesAsText'],
      ...selectedReport?.fieldValues?.['_fieldValuesAsText']
    }
    return section.viewFields.some(
      (fieldName) => !stringIsNullOrEmpty(fieldValuesAsText?.[fieldName])
    )
  }

  return false
}

/**
 * Component logic hook for `Sections`
 */
export function useSections() {
  const context = useProjectStatusContext()
  const { data, isDataLoaded, selectedReport } = context.state
  if (!isDataLoaded) return data.sections
  return data.sections
    .filter((sec) => sectionHasContent(sec, selectedReport, data.properties))
    .filter((sec) => sec.showAsSection || sec.type === SectionType.SummarySection)
}
