import { useContext, useMemo } from 'react'
import { ProjectInformationContext } from '../context'
import { ProjectInformationField } from '../types'

/**
 * Hook for the `EditPropertiesPanel` fields.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useEditPropertiesPanelFields() {
  const context = useContext(ProjectInformationContext)
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
