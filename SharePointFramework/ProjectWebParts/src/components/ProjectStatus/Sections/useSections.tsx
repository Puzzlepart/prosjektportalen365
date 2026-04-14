import { stringIsNullOrEmpty } from '@pnp/core'
import { SectionModel, SectionType } from 'pp365-shared-library/lib/models'
import { useProjectStatusContext } from '../context'

/**
 * Component logic hook for `Sections`. Returns the sections that have
 * displayable content and are configured to show, filtering against
 * the currently selected status report and project properties.
 */
export function useSections() {
  const context = useProjectStatusContext()
  const { data, isDataLoaded, selectedReport } = context.state
  if (!isDataLoaded) return data.sections

  const sectionHasContent = (section: SectionModel): boolean => {
    const { value, comment } = selectedReport?.getStatusValue(section.fieldName) ?? {}
    if (!stringIsNullOrEmpty(value) || !stringIsNullOrEmpty(comment)) return true

    if (section.type === SectionType.ProjectPropertiesSection && section.viewFields?.length > 0) {
      const fieldValuesAsText = {
        ...data.properties?.fieldValues?.['_fieldValuesAsText'],
        ...selectedReport?.fieldValues?.['_fieldValuesAsText']
      }
      return section.viewFields.some(
        (fieldName) => !stringIsNullOrEmpty(fieldValuesAsText?.[fieldName])
      )
    }

    return false
  }

  return data.sections
    .filter((sec) => sectionHasContent(sec))
    .filter((sec) => sec.showAsSection || sec.type === SectionType.SummarySection)
}
