import { truncateString } from 'pp365-shared-library/lib/util/truncateString'
import { HTMLProps, useContext, useEffect, useRef, useState } from 'react'
import { ProjectPhasesContext } from '../context'
import { OPEN_POPOVER } from '../reducer'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'
import { PopoverProps } from '@fluentui/react-components'

/**
 * Component logic hook for `ProjectPhase`.
 */
export function useProjectPhase(props: IProjectPhaseProps) {
  const context = useContext(ProjectPhasesContext)
  const targetRef = useRef<HTMLLIElement>()
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
  const subTextProps: HTMLProps<HTMLDivElement> = {
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
    phasesLength
  } as const
}
