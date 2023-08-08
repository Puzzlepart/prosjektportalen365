import { stringIsNullOrEmpty } from '@pnp/core'
import { SectionType } from 'pp365-shared-library/lib/models'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'

/**
 * Component logic hook for `Sections`
 */
export function useSections() {
  const context = useContext(ProjectStatusContext)
  let sections = context.state.data.sections
  if (context.state.isDataLoaded) {
    sections = sections
      .filter(
        (sec) =>
          !stringIsNullOrEmpty(context.state.selectedReport?.getStatusValue(sec.fieldName)?.value)
      )
      .filter((sec) => sec.showAsSection || sec.type === SectionType.SummarySection)
  }
  return { sections } as const
}
