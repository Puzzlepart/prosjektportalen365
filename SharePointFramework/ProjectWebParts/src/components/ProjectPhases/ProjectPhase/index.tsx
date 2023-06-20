import React, { FC } from 'react'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'
import { useProjectPhase } from './useProjectPhase'

export const ProjectPhase: FC<IProjectPhaseProps> = (props) => {
  const { targetRef, onClick, className, subTextProps } = useProjectPhase(props)

  return (
    <li className={className}>
      <a href='#' className={styles.container}>
        <div className={styles.phaseIcon}>
          <span className={styles.phaseLetter} ref={targetRef} onClick={onClick}>
            {props.phase.letter}
          </span>
          <span className={styles.phaseText} onClick={onClick}>
            {props.phase.name}
          </span>
          <div {...subTextProps}></div>
        </div>
      </a>
    </li>
  )
}

export * from './types'
