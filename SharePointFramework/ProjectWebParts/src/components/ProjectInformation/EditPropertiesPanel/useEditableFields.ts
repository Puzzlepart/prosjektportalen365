import { DisplayMode } from '@microsoft/sp-core-library'
import { useMemo } from 'react'
import { useProjectInformationContext } from '../context'

/**
 * Hook for the `EditPropertiesPanel` fields.
 *
 * @param hiddenFields Fields to be hidden in the `EditPropertiesPanel`.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useEditableFields(hiddenFields: string[] = []) {
  const context = useProjectInformationContext()
  return useMemo(
    () =>
      context.state.properties
        .filter(
          (p) => p.isVisible(DisplayMode.Edit) && !hiddenFields.includes(p.internalName)
        )
        .sort((a, b) => a.column?.sortOrder - b.column?.sortOrder),
    [context.state.properties]
  )
}
