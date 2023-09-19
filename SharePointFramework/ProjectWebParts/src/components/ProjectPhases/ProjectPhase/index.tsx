import React, { FC, useEffect } from 'react'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'
import { useProjectPhase } from './useProjectPhase'
import { Popover, PopoverProps, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import { ProjectPhaseCallout } from './ProjectPhaseCallout'

export const ProjectPhase: FC<IProjectPhaseProps> = (props) => {
  const { targetRef, handleOpenChange, open, className, subTextProps, context } = useProjectPhase(props)

  return (
    <Popover withArrow positioning='below' open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger disableButtonEnhancement>
        <li className={className} ref={targetRef}>
          <span>{props.phase.name}</span>
          {/* <div {...subTextProps}></div> */}
          {/* <div className={styles.phaseIcon}>
          <span className={styles.phaseLetter} ref={targetRef} onClick={onClick}>
            {props.phase.letter}
          </span>

          <div {...subTextProps}></div>
        </div> */}
        </li>
    </PopoverTrigger>
      <PopoverSurface>
        <ProjectPhaseCallout {...(context.state.callout || {})} />
    </PopoverSurface>
  </Popover>

  )
}

export * from './types'
