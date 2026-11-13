import React, { FC } from 'react'
import { IProjectPhaseProps } from './types'
import { useProjectPhase } from './useProjectPhase'
import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import { ProjectPhasePopover } from './ProjectPhasePopover'
import styles from './ProjectPhase.module.scss'

/**
 * A phase in the phase selector: an item of the phases' list, holding the button that opens the
 * phase in a popover. The current phase is marked as the current step, and the popover is a
 * dialog named by the phase and described by its description, that keeps the focus until it is
 * closed.
 */
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
    customPhaseColor,
    isCurrentPhase,
    titleId,
    descriptionId
  } = useProjectPhase(props)

  return (
    <li
      className={className}
      style={{ ...customPhaseColor, ...(phasesLength > 6 ? altPadding : {}) }}
      ref={targetRef}
    >
      <Popover withArrow positioning='below' open={open} onOpenChange={handleOpenChange} trapFocus>
        <PopoverTrigger disableButtonEnhancement>
          <button
            type='button'
            className={styles.trigger}
            aria-current={isCurrentPhase ? 'step' : undefined}
          >
            {/* No `title`: the name is never cut short, and one equal to it was read twice. */}
            <span className={styles.name}>{props.phase.name}</span>
            <span {...subTextProps} />
          </button>
        </PopoverTrigger>
        <PopoverSurface
          aria-labelledby={titleId}
          aria-describedby={props.phase.description ? descriptionId : undefined}
        >
          <ProjectPhasePopover
            {...(context.state.popover || {})}
            titleId={titleId}
            descriptionId={descriptionId}
          />
        </PopoverSurface>
      </Popover>
    </li>
  )
}
