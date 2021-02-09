import { truncateString } from 'pp365-shared/lib/helpers/truncateString'
import React, { useContext, useRef } from 'react'
import { ProjectPhasesContext } from '../context'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'

export const ProjectPhase = ({ phase, isCurrentPhase, onOpenCallout }: IProjectPhaseProps) => {
  const context = useContext(ProjectPhasesContext)
  const targetRef = useRef()
  const classNames = [styles.projectPhase]

  if (isCurrentPhase) classNames.push(styles.isCurrentPhase)
  if (phase.properties.PhaseLevel) {
    const className = phase.properties.PhaseLevel.toLowerCase()
    classNames.push(styles[className])
  }

  return (
    <li className={classNames.join(' ')}>
      <a href='#' className={styles.container}>
        <div className={styles.phaseIcon}>
          <span
            className={styles.phaseLetter}
            ref={targetRef}
            onMouseOver={() => onOpenCallout(targetRef.current, phase)}>
            {phase.letter}
          </span>
          <span
            className={styles.phaseText}
            onMouseOver={() => onOpenCallout(targetRef.current, phase)}>
            {phase.name}
          </span>
          <span
            hidden={!context.props.showSubText}
            className={styles.phaseSubText}
            title={phase.subText}
            dangerouslySetInnerHTML={{ __html: truncateString(phase.subText, context.props.subTextTruncateLength || 50) }}></span>
        </div>
      </a>
    </li>
  )
}

export * from './types'
