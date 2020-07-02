import * as React from 'react'
import styles from './ProjectPhase.module.scss'
import { IProjectPhaseProps } from './IProjectPhaseProps'

/**
 * @component ProjectPhase
 */
const ProjectPhase = ({ phase, isCurrentPhase, onOpenCallout }: IProjectPhaseProps) => {
    const phaseLetterRef = React.useRef()

    function className() {
        const classNames = [styles.projectPhase]
        if (isCurrentPhase) {
            classNames.push(styles.isCurrentPhase)
        }
        if (phase.properties.PhaseLevel) {
            const className = phase.properties.PhaseLevel.toLowerCase()
            classNames.push(styles[className])
        }
        return classNames.join(' ')
    }

    return (
        <li className={className()}>
            <a href='#' className={styles.container}>
                <div className={styles.phaseIcon}>
                    <span
                        className={styles.phaseLetter}
                        ref={phaseLetterRef}
                        onMouseOver={() => onOpenCallout(phaseLetterRef.current)}>
                        {phase.letter}
                    </span>
                    <span
                        className={styles.phaseText}
                        onMouseOver={() => onOpenCallout(phaseLetterRef.current)}>{phase.name}</span>
                    <span className={styles.phaseSubText}></span>
                </div>
            </a>
        </li>
    )

}

export default ProjectPhase

export { IProjectPhaseProps }

