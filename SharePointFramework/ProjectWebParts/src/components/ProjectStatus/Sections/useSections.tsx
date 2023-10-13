import { stringIsNullOrEmpty } from '@pnp/core'
import { SectionType } from 'pp365-shared-library/lib/models'
import { useProjectStatusContext } from '../context'

/**
 * Component logic hook for `Sections`
 */
export function useSections() {
  const context = useProjectStatusContext()
  const { data, isDataLoaded, selectedReport } = context.state
  if (!isDataLoaded) return data.sections
  return data.sections
    .filter(
      (sec) =>
        !stringIsNullOrEmpty(selectedReport?.getStatusValue(sec.fieldName)?.value)
    )
    .filter((sec) => sec.showAsSection || sec.type === SectionType.SummarySection)
}
