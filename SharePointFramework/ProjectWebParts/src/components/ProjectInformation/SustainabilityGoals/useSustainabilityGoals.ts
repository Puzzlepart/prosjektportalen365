import { DisplayMode } from '@microsoft/sp-core-library'
import { useProjectInformationContext } from '../context'
import { getSustainabilityGoals } from './goalAssets'

/** Provides the selected sustainability goals for the dedicated visual section. */
export function useSustainabilityGoals() {
  const context = useProjectInformationContext()
  const model = context.state.properties?.find(
    (property) => property.internalName === 'GtUNSustDevGoals'
  )
  const iconSize = context.props.sustainabilityGoalIconSize ?? 48
  const isVisible = model?.isVisible(
    DisplayMode.Read,
    context.props.page,
    context.props.showFieldExternal,
    context.props.fallbackVisibleFields
  )

  if (!context.props.showSustainabilityGoals || !model || model.isEmpty || !isVisible) {
    return { goals: [], iconSize, title: model?.displayName }
  }

  return {
    goals: getSustainabilityGoals(model.getParsedValue()),
    iconSize,
    title: model.displayName
  }
}
