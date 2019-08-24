import * as React from 'react';
import styles from './ProjectPhase.module.scss';
import { IProjectPhaseProps } from './IProjectPhaseProps';

/**
 * @component ProjectPhase
 */
export default class ProjectPhase extends React.PureComponent<IProjectPhaseProps, {}> {
    public render() {
        return (<li className={this._className}>
            <a href='#' className={styles.container}>
                <div className={styles.phaseIcon}>
                    <span className={styles.phaseLetter} ref='phaseLetter' onMouseOver={_event => this.props.onOpenCallout(this.refs['phaseLetter'])}>{this.props.phase.letter}</span>
                    <span className={styles.phaseText} onMouseOver={_event => this.props.onOpenCallout(this.refs['phaseLetter'])}>{this.props.phase.name}</span>
                    <span className={styles.phaseSubText}></span>
                </div>
            </a>
        </li>);
    }

    private get _className() {
        let classNames = [styles.projectPhase];
        if (this.props.isCurrentPhase) {
            classNames.push(styles.isCurrentPhase);
        }
        if (this.props.phase.properties.PhaseLevel) {
            let className = this.props.phase.properties.PhaseLevel.toLowerCase();
            classNames.push(styles[className]);
        }
        return classNames.join(' ');
    }
}

export { IProjectPhaseProps };

