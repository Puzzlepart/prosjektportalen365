import { truncateString } from 'pp365-shared-library/lib/util/truncateString'
import { getContrastRatio } from 'pp365-shared-library'
import { HTMLProps, useContext, useEffect, useRef, useState } from 'react'
import { ProjectPhasesContext } from '../context'
import { OPEN_POPOVER } from '../reducer'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'
import { PopoverProps, useId } from '@fluentui/react-components'
import pSBC from 'shade-blend-color'
import { hslToHex, hexToHsl } from 'colors-convert'

/**
 * The stylesheet's colours for a phase without a colour of its own, by phase level: the phase, a
 * phase under the pointer, the current phase, and the current phase under the pointer. The phases
 * are light with black text and the current phase dark with white text, each 4.5:1 or more
 * (#1788, chosen over dark phases throughout).
 */
const DEFAULT_PHASE_COLORS: Record<string, [string, string, string, string]> = {
  project: ['#89ce87', '#54b054', '#336f33', '#2c5f2c'],
  portfolio: ['#9dceee', '#64addb', '#226894', '#1e597f'],
  end: ['#f0c993', '#f09440', '#994f0c', '#83440a']
}

/**
 * The text colour on a phase: white where it reads 4.5:1 on every colour the phase takes, at rest
 * and under the pointer, otherwise black or white, whichever reads better on the worst of them
 * (WCAG 1.4.3). The stylesheet uses it for the phase's name, its sub text and its focus ring.
 *
 * @param backgrounds The colours the phase takes
 */
function phaseTextColor(backgrounds: string[]): string {
  const worst = (color: string) =>
    Math.min(...backgrounds.map((background) => getContrastRatio(color, background) ?? 21))
  if (worst('#ffffff') >= 4.5) return '#ffffff'
  return worst('#000000') >= worst('#ffffff') ? '#000000' : '#ffffff'
}

/**
 * Component logic hook for `ProjectPhase`.
 */
export function useProjectPhase(props: IProjectPhaseProps) {
  const context = useContext(ProjectPhasesContext)
  const targetRef = useRef<HTMLLIElement>()
  const titleId = useId('project-phase-title')
  const classNames = [styles.projectPhase]
  const isCurrentPhase = props.phase.id === context.state.phase?.id
  const [open, setOpen] = useState(false)
  const phasesLength = context.state.data.phases.filter(
    (phase) => phase.properties.ShowOnFrontpage === 'true'
  ).length

  if (context.props.useStartArrow) classNames.push(styles.useStartArrow)
  if (context.props.useEndArrow) classNames.push(styles.useEndArrow)
  if (isCurrentPhase) classNames.push(styles.isCurrentPhase)

  if (props.phase.properties.PhaseLevel) {
    const className = props.phase.properties.PhaseLevel.toLowerCase()
    classNames.push(styles[className])
  }

  const subTextProps: HTMLProps<HTMLSpanElement> = {
    hidden: !context.props.showSubText,
    className: styles.subText,
    title: props.phase.subText,
    dangerouslySetInnerHTML: {
      __html: truncateString(props.phase.subText ?? '', context.props.subTextTruncateLength ?? 50)
    }
  }

  const handleOpenChange: PopoverProps['onOpenChange'] = (e, data) => {
    setOpen(data.open || false)
    context.dispatch(OPEN_POPOVER({ phase: props.phase, target: targetRef.current }))
  }

  const altPadding = {
    paddingRight: '.125em',
    paddingLeft: '.125em'
  }

  const phaseColor = props.phase.properties.PhaseColor

  const adjustColor = (hex: string, saturation: number, darken: number) => {
    if (!hex) return
    const hslColor = hexToHsl(pSBC(darken, hex))

    if (hslColor.s === 0) {
      return hslToHex({ ...hslColor, l: hslColor.l - 0.1 })
    }

    hslColor.s = saturation
    return hslToHex(hslColor)
  }

  const level = props.phase.properties.PhaseLevel?.toLowerCase()
  const defaultColors = DEFAULT_PHASE_COLORS[level] ?? DEFAULT_PHASE_COLORS.project
  const currentColor = adjustColor(phaseColor, 40, -0.25)
  const currentHoverColor = adjustColor(phaseColor, 42, -0.45)
  // A phase of the customer's own colour takes its current colour under the pointer, as before; the
  // default phases a darker shade of their own light colour. Whether a customer's colours read is
  // the customer's to judge; the text takes black or white by the contrast either way.
  const hoverColor = currentColor
  const backgrounds = isCurrentPhase
    ? [currentColor ?? defaultColors[2], currentHoverColor ?? defaultColors[3]]
    : [phaseColor ?? defaultColors[0], hoverColor ?? defaultColors[1]]

  const customPhaseColor = {
    '--font-color': phaseTextColor(backgrounds),
    '--phase-color': phaseColor,
    '--phase-hover-color': hoverColor,
    '--phase-current-color': currentColor,
    '--phase-current-hover-color': currentHoverColor
  }

  useEffect(() => {
    if (context.state.popover === null) {
      setOpen(false)
    }
  }, [context.state.popover])

  return {
    targetRef,
    handleOpenChange,
    open,
    className: classNames.join(' '),
    subTextProps,
    context,
    phasesLength,
    isCurrentPhase,
    altPadding,
    customPhaseColor,
    titleId
  } as const
}
