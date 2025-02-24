import React, { FC } from 'react'
import { IProjectPhaseProps } from './types'
import { useProjectPhase } from './useProjectPhase'
import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import { ProjectPhasePopover } from './ProjectPhasePopover'
import pSBC from 'shade-blend-color'
import { hslToHex, hexToHsl } from 'colors-convert'

export const ProjectPhase: FC<IProjectPhaseProps> = (props) => {
  const {
    targetRef,
    handleOpenChange,
    open,
    className,
    subTextProps,
    context,
    phasesLength
  } = useProjectPhase(props)

  const altPadding = {
    paddingRight: '.125em',
    paddingLeft: '.125em'
  }

  const phaseColor = '#89ce87'

  const changeSaturationAndDarken = (hex: string, saturation: number, darken: number) => {
    const blendedHex = pSBC(darken, hex)
    let hslColor = hexToHsl(blendedHex)
    hslColor.s = saturation
    return hslToHex(hslColor)
  }

  const customPhaseColor = {
    '--phase-color': phaseColor,
    '--phase-current-color': changeSaturationAndDarken(phaseColor, 40, -0.25),
    '--phase-current-hover-color': changeSaturationAndDarken(phaseColor, 42, -0.45)
  }

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
