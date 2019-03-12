import * as React from 'react';
import styles from './ProjectPhase.module.scss';
import { IProjectPhaseProps } from './IProjectPhaseProps';

const ProjectPhase = (props: IProjectPhaseProps) => {
    let phaseLetter: HTMLSpanElement;
    let classNames = [styles.projectPhase];
    if (props.isCurrentPhase) {
        classNames.push(styles.isCurrentPhase);
    }

    return (
        <li className={classNames.join(' ')}>
            <a href='#' className={styles.projectPhaseIcon}>
                <div className={styles.projectPhaseIconContainer}>
                    <span
                        className={styles.phaseLetter}
                        ref={ele => phaseLetter = ele}
                        onMouseOver={_event => props.onOpenCallout(phaseLetter)}>{props.phase.letter}</span>
                    <span
                        className={styles.phaseText}
                        onMouseOver={_event => props.onOpenCallout(phaseLetter)}>{props.phase.name}</span>
                    <span className={styles.phaseSubText}></span>
                </div>
            </a>
        </li>
    );
};

export default ProjectPhase;
export { IProjectPhaseProps };

