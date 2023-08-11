import { DisplayMode } from '@microsoft/sp-core-library'
import { useProjectInformationContext } from '../context'
import { IProjectPropertiesProps } from './types'

/**
 * Hook for getting the project properties based on `displayAllProperties`
 * property and column visibility configured in the configuration list.
 *
 * @param props Props for the `ProjectProperties` component.
 */
export function useProjectProperties(props: IProjectPropertiesProps) {
  const context = useProjectInformationContext()
  const properties = context.state.properties
    .filter((p) => !!p.column)
    .filter((p) => {
      if (props.displayAllProperties) return true
      return p.isVisible(DisplayMode.Read, context.props.page)
    })
  return properties.filter((p) => !p.isEmpty)
}
