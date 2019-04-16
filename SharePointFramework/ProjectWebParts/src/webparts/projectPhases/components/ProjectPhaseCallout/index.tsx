
import * as React from 'react';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { IProjectPhaseCalloutProps } from './IProjectPhaseCalloutProps';
import styles from './ProjectPhaseCallout.module.scss';
import * as strings from 'ProjectPhasesWebPartStrings';

// ProjectPhaseCallout
export default class ProjectPhaseCallout extends React.PureComponent<IProjectPhaseCalloutProps, {}> {
    /**
     * Constructor
     * 
     * @param {IProjectPhaseCalloutProps} props Initial props
     */
    constructor(props: IProjectPhaseCalloutProps) {
        super(props);
    }

    /**
     * Renders the <ProjectPhaseCallout /> component
     */
    public render(): JSX.Element {
        const { phase, isCurrentPhase, onChangePhase, gapSpace } = this.props;
        return (
            <Callout
                gapSpace={gapSpace}
                target={phase.target}
                onDismiss={this.props.onDismiss}
                setInitialFocus={true}
                hidden={false}>
                <div className={styles.projectPhaseCallout}>
                    <div className={styles.header}>
                        <span className={styles.title}>{phase.model.name}</span>
                    </div>
                    <div className={styles.body}>
                        <p className={styles.subText}>{phase.model.term.LocalCustomProperties.PhasePurpose}</p>
                        <div>
                            <div className={styles.stats} hidden={Object.keys(phase.model.checklistData.stats).length === 0}>
                                {Object.keys(phase.model.checklistData.stats).map(status => {
                                    return <div><span>{phase.model.checklistData.stats[status]} {strings.CheckPointsMarkedAsText} {status}</span></div>;
                                })}
                            </div>
                            <div className={styles.actions}>
                                <ActionButton
                                    href={this.getPlannerPageUrl(this.props)}
                                    text={strings.TasksLinkText}
                                    iconProps={{ iconName: 'PlannerLogo' }} />
                                <ActionButton
                                    href={this.getFilteredPhaseChecklistViewUrl(this.props)}
                                    text={strings.PhaseChecklistLinkText}
                                    iconProps={{ iconName: 'CheckList' }} />
                                <ActionButton
                                    onClick={_ => onChangePhase(phase.model)}
                                    text={strings.ChangePhaseText}
                                    iconProps={{ iconName: 'TransitionPop' }}
                                    disabled={isCurrentPhase} />
                            </div>
                        </div>
                    </div>
                </div>
            </Callout>
        );
    }

    /**
     * Get planner page url
     * 
     * @param {IProjectPhaseCalloutProps} param0 Props
     */
    protected getPlannerPageUrl({ webAbsoluteUrl, phase }: IProjectPhaseCalloutProps): string {
        return `${webAbsoluteUrl}/SitePages/Oppgaver-${phase.model.name}.aspx`;
    }

    /**
     * Get filtered phase checklist view url
     * 
     * @param {IProjectPhaseCalloutProps} param0 Props
     */
    protected getFilteredPhaseChecklistViewUrl({ webAbsoluteUrl, phase }: IProjectPhaseCalloutProps): string {
        return `${webAbsoluteUrl}/${strings.PhaseChecklistViewUrl}?FilterField1=GtProjectPhase&FilterValue1=${phase.model.name}`;
    }
}