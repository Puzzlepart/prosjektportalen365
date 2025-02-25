import React, { FC } from 'react'
import { IProjectPhaseProps } from './types'
import { useProjectPhase } from './useProjectPhase'
import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import { ProjectPhasePopover } from './ProjectPhasePopover'

export const ProjectPhase: FC<IProjectPhaseProps> = (props) => {
  const {
    targetRef,
    handleOpenChange,
    open,
    className,
    subTextProps,
    context,
    phasesLength,
    altPadding,
    customPhaseColor
  } = useProjectPhase(props)

  return (
    <>
      <Popover withArrow positioning='below' open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger disableButtonEnhancement>
          <li
            className={className}
            style={{ ...customPhaseColor, ...(phasesLength > 6 ? altPadding : {}) }}
            ref={targetRef}
          >
            <span title={props.phase.name}>{props.phase.name}</span>
            <div {...subTextProps}></div>
          </li>
        </PopoverTrigger>
        <PopoverSurface>
          <ProjectPhasePopover {...(context.state.popover || {})} />
        </PopoverSurface>
      </Popover>
    </>
  )
}
