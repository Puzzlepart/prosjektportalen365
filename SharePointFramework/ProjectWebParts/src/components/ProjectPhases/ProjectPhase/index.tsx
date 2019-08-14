import * as React from 'react';
import styles from './ProjectPhase.module.scss';
import { IProjectPhaseProps } from './IProjectPhaseProps';

export default class ProjectPhase extends React.PureComponent<IProjectPhaseProps, {}> {
    public render() {
        return (
            <li className={this.getClassName(this.props)}>
                <a href='#' className={styles.container}>
                    <div className={styles.phaseIcon}>
                        <span
                            className={styles.phaseLetter}
                            ref='phaseLetter'
                            onMouseOver={_event => this.props.onOpenCallout(this.refs['phaseLetter'])}>{this.props.phase.letter}</span>
                        <span
                            className={styles.phaseText}
                            onMouseOver={_event => this.props.onOpenCallout(this.refs['phaseLetter'])}>{this.props.phase.name}</span>
                        <span className={styles.phaseSubText}></span>
                    </div>
                </a>
            </li>
        );
    }

    /**
     * Get class name
     * 
     * @param {IProjectPhaseProps} param0 Props
     */
    protected getClassName({ isCurrentPhase, phase }: IProjectPhaseProps) {
        let classNames = [styles.projectPhase];
        if (isCurrentPhase) {
            classNames.push(styles.isCurrentPhase);
        }
        if (phase.properties.PhaseLevel) {
            let className = phase.properties.PhaseLevel.toLowerCase();
            classNames.push(styles[className]);
        }
        return classNames.join(' ');
    }
}

export { IProjectPhaseProps };

