import * as strings from 'PortfolioWebPartsStrings'
import { useIdeaModuleContext } from '../context'
import { IdeaPhase } from '../types'
import { IIdeaPhaseStep } from './types'

/**
 * The phases an idea goes through, in order.
 */
const IDEA_PHASES: Omit<IIdeaPhaseStep, 'isCurrent'>[] = [
  {
    phase: IdeaPhase.Registration,
    name: strings.Idea.RegistrationPhaseTitle,
    iconName: 'Lightbulb'
  },
  { phase: IdeaPhase.Processing, name: strings.Idea.ProcessingPhaseTitle, iconName: 'Edit' },
  {
    phase: IdeaPhase.ApprovedForConcept,
    name: strings.Idea.ApprovedPhaseTitle,
    iconName: 'CheckmarkCircle'
  },
  { phase: IdeaPhase.Provisioned, name: strings.Idea.ProvisionAreaTitle, iconName: 'BoxToolbox' }
]

/**
 * Component logic hook for `IdeaPhaseBar`: the phases an idea goes through, the one the selected
 * idea is in marked as current.
 */
export function useIdeaPhaseBar(): IIdeaPhaseStep[] {
  const context = useIdeaModuleContext()
  return IDEA_PHASES.map((step) => ({ ...step, isCurrent: context.state.phase === step.phase }))
}
