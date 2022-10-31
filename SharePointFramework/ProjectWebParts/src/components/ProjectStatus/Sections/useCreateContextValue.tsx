import { SectionModel } from 'pp365-shared/lib/models'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { ISectionContext } from './context'

export function useCreateContextValue({ iconSize = 30 }) {
  const context = useContext(ProjectStatusContext)
  return (section: SectionModel) => {
    const { value, comment } = context.state.selectedReport?.getStatusValue(section.fieldName) ?? {}
    const [columnConfig] = context.state.data.columnConfig.filter(
      (c) => c.columnFieldName === section.fieldName && c.value === value
    )
    return {
      headerProps: {
        label: section.name,
        value,
        comment,
        iconName: section.iconName,
        iconSize,
        iconColor: columnConfig?.color ?? '#444'
      },
      section
    } as ISectionContext
  }
}
