import { SectionModel } from 'pp365-shared/lib/models'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { ISectionContext } from './context'

export function useCreateContextValue() {
  const context = useContext(ProjectStatusContext)
  return (section: SectionModel) => {
    const { value, comment } = context.state.selectedReport?.getStatusValue(section.fieldName)
    const [columnConfig] = context.state.data.columnConfig.filter(
      (c) => c.columnFieldName === section.fieldName && c.value === value
    )
    return {
      headerProps: {
        label: section.name,
        value,
        comment,
        iconName: section.iconName,
        iconSize: 50,
        iconColor: columnConfig ? columnConfig.color : '#444'
      },
      section
    } as ISectionContext
  }
}
