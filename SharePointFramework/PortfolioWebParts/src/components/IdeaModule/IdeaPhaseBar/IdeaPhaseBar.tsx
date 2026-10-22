import React, { FC } from 'react'
import styles from './IdeaPhaseBar.module.scss'
import { mergeClasses } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import { useIdeaPhaseBar } from './useIdeaPhaseBar'

/**
 * The phases an idea goes through, the current one marked: an ordered list, where they were tabs
 * that did nothing, the other phases disabled and the arrows between them nameless tabs (WCAG
 * 1.3.1, 4.1.2). The other phases are in a readable grey, not a disabled one (WCAG 1.4.3).
 */
export const IdeaPhaseBar: FC = () => {
  const phases = useIdeaPhaseBar()
  return (
    // An explicit role: Safari drops a list's role when its markers are hidden.
    <ol className={styles.ideaPhases} role='list' aria-label={strings.Idea.PhasesLabel}>
      {phases.map((phase, index) => (
        <li
          key={phase.phase}
          className={styles.step}
          aria-current={phase.isCurrent ? 'step' : undefined}
        >
          <span className={mergeClasses(styles.phase, phase.isCurrent && styles.current)}>
            {getFluentIcon(phase.iconName, { size: 20 })}
            {phase.name}
          </span>
          {index < phases.length - 1 && (
            <span className={styles.separator} aria-hidden>
              {getFluentIcon('ChevronRight', { size: 20 })}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
