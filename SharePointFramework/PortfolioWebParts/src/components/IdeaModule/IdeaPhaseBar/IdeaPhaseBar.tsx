import React, { FC } from 'react'
import styles from './IdeaPhaseBar.module.scss'
import { mergeClasses } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import { useIdeaModuleContext } from '../context'
import { IdeaPhase } from '../types'

/**
 * The phases an idea goes through, the current one marked: an ordered list, where they were tabs
 * that did nothing, the other phases disabled and the arrows between them nameless tabs (WCAG
 * 1.3.1, 4.1.2). The other phases are in a readable grey, not a disabled one (WCAG 1.4.3).
 */
export const IdeaPhaseBar: FC = () => {
  const context = useIdeaModuleContext()

  const phases = [
    {
      phase: IdeaPhase.Registration,
      name: strings.Idea.RegistrationPhaseTitle,
      icon: getFluentIcon('Lightbulb', { size: 20 })
    },
    {
      phase: IdeaPhase.Processing,
      name: strings.Idea.ProcessingPhaseTitle,
      icon: getFluentIcon('Edit', { size: 20 })
    },
    {
      phase: IdeaPhase.ApprovedForConcept,
      name: strings.Idea.ApprovedPhaseTitle,
      icon: getFluentIcon('CheckmarkCircle', { size: 20 })
    },
    {
      phase: IdeaPhase.Provisioned,
      name: strings.Idea.ProvisionAreaTitle,
      icon: getFluentIcon('BoxToolbox', { size: 20 })
    }
  ]
  return (
    // An explicit role: Safari drops a list's role when its markers are hidden.
    <ol className={styles.ideaPhases} role='list' aria-label={strings.Idea.PhasesLabel}>
      {phases.map((phase, index) => {
        const isCurrent = context.state.phase === phase.phase
        return (
          <li
            key={phase.phase}
            className={styles.step}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className={mergeClasses(styles.phase, isCurrent && styles.current)}>
              {phase.icon}
              {phase.name}
            </span>
            {index < phases.length - 1 && (
              <span className={styles.separator} aria-hidden>
                {getFluentIcon('ChevronRight', { size: 20 })}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
