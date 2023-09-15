import React, { FC } from 'react'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'
import { useProjectPhase } from './useProjectPhase'

export const ProjectPhase: FC<IProjectPhaseProps> = (props) => {
  const { targetRef, onClick, className } = useProjectPhase(props)

  return (
    <li className={className}>
      <span>{props.phase.name}</span>
        {/* <div className={styles.phaseIcon}>
          <span className={styles.phaseLetter} ref={targetRef} onClick={onClick}>
            {props.phase.letter}2
          </span>
          <span className={styles.phaseText} onClick={onClick}>
            {props.phase.name}
          </span>
          <div {...subTextProps}></div>
        </div> */}
    </li>
  )
}

export * from './types'
