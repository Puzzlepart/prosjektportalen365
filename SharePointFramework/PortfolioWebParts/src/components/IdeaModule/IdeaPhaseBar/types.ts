import { FluentIconName } from 'pp365-shared-library'
import { IdeaPhase } from '../types'

/**
 * A phase of the idea phase bar, as the bar shows it.
 */
export interface IIdeaPhaseStep {
  /**
   * The phase.
   */
  phase: IdeaPhase

  /**
   * The phase's name, from the strings.
   */
  name: string

  /**
   * The icon shown before the name.
   */
  iconName: FluentIconName

  /**
   * Whether the idea is in this phase.
   */
  isCurrent: boolean
}
