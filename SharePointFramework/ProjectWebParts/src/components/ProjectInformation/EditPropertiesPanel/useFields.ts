import { useMemo } from 'react'
import { useProjectInformationContext } from '../context'
import { DisplayMode } from '@microsoft/sp-core-library'
import { IProjectInformationProps } from '..'

/**
 * Hook for the `EditPropertiesPanel` fields.
 *
 * @param props Properties for the `ProjectInformation` component.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useFields(props: IProjectInformationProps, hiddenFields: string[] = []) {
  const context = useProjectInformationContext()
  return useMemo(
    () =>
      context.state.properties.filter(
        (p) => p.isVisible(DisplayMode.Edit) && !hiddenFields.includes(p.internalName)
      ),
    [context.state.properties]
  )
}
