import { DisplayMode } from '@microsoft/sp-core-library'
import { useProjectInformationContext } from '../context'
import { IProjectPropertiesProps } from './types'
import { useMemo } from 'react'

/**
 * Hook for getting the project properties based on `displayAllProperties`
 * property and column visibility configured in the configuration list.
 *
 * @param props Props for the `ProjectProperties` component.
 */
export function useProjectProperties(props: IProjectPropertiesProps) {
  const context = useProjectInformationContext()
  return useMemo(
    () =>
      context.state.properties
        .filter((p) => !p.isSystemField)
        .filter((p) => {
          if (props.displayAllProperties) return true
          return p.isVisible(
            DisplayMode.Read,
            context.props.page,
            context.props.showFieldExternal,
            context.props.fallbackVisibleFields
          )
        })
        .filter((p) => !p.isEmpty),
    [
      context.state.properties,
      context.props.fallbackVisibleFields,
      context.props.page,
      context.props.showFieldExternal,
      props.displayAllProperties
    ]
  )
}
