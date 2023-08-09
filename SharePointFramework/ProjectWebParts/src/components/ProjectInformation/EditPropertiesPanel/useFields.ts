import { useMemo } from 'react'
import { ProjectInformationField } from '../ProjectInformationField'
import { useProjectInformationContext } from '../context'

/**
 * Hook for the `EditPropertiesPanel` fields.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useFields() {
  const context = useProjectInformationContext()
  return useMemo<ProjectInformationField[]>(
    () =>
      context.state.data.fields
        .map((f) => {
          const col = context.state.data.columns.find((col) => col.internalName === f.InternalName)
          return new ProjectInformationField(f, col)
        })
        .filter(Boolean)
        .filter((f) => f.showInEditForm),
    [context.state.data]
  )
}
