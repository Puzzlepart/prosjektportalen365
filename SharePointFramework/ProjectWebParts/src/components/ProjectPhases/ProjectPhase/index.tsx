import React, { useRef } from 'react'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'

const ProjectPhase = ({ phase, isCurrentPhase, onOpenCallout }: IProjectPhaseProps) => {
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
          <span className={styles.phaseSubText}></span>
        </div>
      </a>
    </li>
  )
}

export default ProjectPhase

export { IProjectPhaseProps }
