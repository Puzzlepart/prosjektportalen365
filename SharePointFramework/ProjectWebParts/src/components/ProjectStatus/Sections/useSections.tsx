import { stringIsNullOrEmpty } from '@pnp/common'
import { SectionType } from 'pp365-shared/lib/models'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'

export function useSections() {
  const context = useContext(ProjectStatusContext)
  const sections = context.state.data.sections
    .filter(
      (sec) =>
        !stringIsNullOrEmpty(context.state.selectedReport.getStatusValue(sec.fieldName).value)
    )
    .filter((sec) => sec.showAsSection || sec.type === SectionType.SummarySection)

  return { sections } as const
}
