import { truncateString } from 'pp365-shared-library/lib/helpers/truncateString'
import { HTMLProps, useContext, useRef } from 'react'
import { ProjectPhasesContext } from '../context'
import { OPEN_CALLOUT } from '../reducer'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './types'

/**
 * Component logic hook for `ProjectPhase`.
 */
export function useProjectPhase(props: IProjectPhaseProps) {
  const context = useContext(ProjectPhasesContext)
  const targetRef = useRef<HTMLSpanElement>()
  const classNames = [styles.projectPhase]
  const isCurrentPhase = props.phase.id === context.state.phase?.id

  if (isCurrentPhase) classNames.push(styles.isCurrentPhase)
  if (props.phase.properties.PhaseLevel) {
    const className = props.phase.properties.PhaseLevel.toLowerCase()
    classNames.push(styles[className])
  }
  const subTextProps: HTMLProps<HTMLDivElement> = {
    hidden: !context.props.showSubText,
    className: styles.phaseSubText,
    title: props.phase.subText,
    dangerouslySetInnerHTML: {
      __html: truncateString(props.phase.subText ?? '', context.props.subTextTruncateLength ?? 50)
    }
  }
  const onClick = () =>
    context.dispatch(OPEN_CALLOUT({ phase: props.phase, target: targetRef.current }))
  return {
    targetRef,
    onClick,
    className: classNames.join(' '),
    subTextProps
  } as const
}
