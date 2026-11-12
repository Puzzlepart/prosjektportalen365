import { DisplayMode } from '@microsoft/sp-core-library'
import { useProjectInformationContext } from '../context'
import { IProjectPropertiesProps } from './types'
import { useMemo } from 'react'

/** Selects visible non-system properties for the host page or the all-properties view. */
export function useProjectProperties(props: IProjectPropertiesProps) {
  const context = useProjectInformationContext()
  return useMemo(
    () =>
      context.state.properties
        .filter((p) => !p.isSystemField)
        .filter(
          (p) =>
            props.displayAllProperties ||
            !context.props.showSustainabilityGoalsAsIcons ||
            p.internalName !== 'GtUNSustDevGoals'
        )
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
      context.props.showSustainabilityGoalsAsIcons,
      props.displayAllProperties
    ]
  )
}
