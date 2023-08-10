import { useMemo } from 'react'
import { ProjectInformationField } from '../types'
import { useProjectInformationContext } from '../context'

/**
 * Hook for the `EditPropertiesPanel` fields.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useFields() {
  const context = useProjectInformationContext()
  const { fields, columns } = context.state.data
  return useMemo<ProjectInformationField[]>(
    () =>
      fields
        .map(
          (f) =>
            new ProjectInformationField(
              f,
              columns.find(({ internalName }) => internalName === f.InternalName)
            )
        )
        .filter(Boolean)
        .filter((f) => f.showInEditForm),
    [fields, columns]
  )
}
