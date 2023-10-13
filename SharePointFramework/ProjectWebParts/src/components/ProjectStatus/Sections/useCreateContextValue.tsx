import { SectionModel } from 'pp365-shared-library/lib/models'
import { useProjectStatusContext } from '../context'
import { ISectionContext } from './context'

/**
 * Hook for creating context value for `SectionContext`.
 *
 * @remarks Field `GtOverallStatus` is a special case, where
 * the value is stored in the comment field.
 *
 * @returns A callback function
 */
export function useCreateContextValue({ iconSize = 30 }) {
  const context = useProjectStatusContext()
  return (section: SectionModel) => {
    let { value, comment } = context.state.selectedReport.getStatusValue(section.fieldName)
    const [columnConfig] = context.state.data.columnConfig.filter(
      (c) => c.columnFieldName === section.fieldName && c.value === value
    )

    if (section.fieldName === 'GtOverallStatus') {
      comment = value
      value = ''
    }

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
