import { useMemo } from 'react'
import { useProjectInformationContext } from '../context'
import { DisplayMode } from '@microsoft/sp-core-library'

/**
 * Hook for the `EditPropertiesPanel` fields.
 * 
 * @param hiddenFields Fields to be hidden in the `EditPropertiesPanel`.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useFields(hiddenFields: string[]) {
  const context = useProjectInformationContext()
  return useMemo(
    () => context.state.properties.filter((p) => p.isVisible(DisplayMode.Edit) && !hiddenFields.includes(p.internalName)),
    [context.state.properties]
  )
}
