import * as React from 'react'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { IProjectPhaseCalloutProps } from './IProjectPhaseCalloutProps'
import styles from './ProjectPhaseCallout.module.scss'
import * as strings from 'ProjectWebPartsStrings'

/**
 * @component ProjectPhaseCallout
 */
export default class ProjectPhaseCallout extends React.PureComponent<
  IProjectPhaseCalloutProps,
  {}
> {
  /**
   * Constructor
   *
   * @param {IProjectPhaseCalloutProps} props Props
   */
  constructor(props: IProjectPhaseCalloutProps) {
    super(props)
  }

  /**
   * Renders the <ProjectPhaseCallout /> component
   */
  public render(): JSX.Element {
    const { phase, isCurrentPhase, onChangePhase } = this.props
    return (
      <Callout
        gapSpace={5}
        target={phase.target}
        onDismiss={this.props.onDismiss}
        setInitialFocus={true}
        hidden={false}>
        <div className={styles.projectPhaseCallout}>
          <div className={styles.header}>
            <span className={styles.title}>{phase.model.name}</span>
          </div>
          <div className={styles.body}>
            <p className={styles.subText}>{phase.model.properties.PhasePurpose}</p>
            <div>
              <div
                className={styles.stats}
                hidden={Object.keys(phase.model.checklistData.stats).length === 0}>
                {Object.keys(phase.model.checklistData.stats).map((status, idx) => {
                  return (
                    <div key={idx}>
                      <span>
                        {phase.model.checklistData.stats[status]} {strings.CheckPointsMarkedAsText}{' '}
                        {status}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className={styles.actions}>
                <ActionButton
                  href={this._getFilteredPhaseChecklistViewUrl(this.props)}
                  text={strings.PhaseChecklistLinkText}
                  iconProps={{ iconName: 'CheckList' }}
                />
                <ActionButton
                  onClick={() => onChangePhase(phase.model)}
                  text={strings.ChangePhaseText}
                  iconProps={{ iconName: 'TransitionPop' }}
                  disabled={isCurrentPhase || !this.props.isSiteAdmin}
                />
              </div>
            </div>
          </div>
        </div>
      </Callout>
    )
  }

  /**
   * Get filtered phase checklist view url
   *
   * @param {IProjectPhaseCalloutProps} param0 Props
   */
  protected _getFilteredPhaseChecklistViewUrl({
    webUrl,
    phase
  }: IProjectPhaseCalloutProps): string {
    return `${webUrl}/${strings.PhaseChecklistViewUrl}?FilterField1=GtProjectPhase&FilterValue1=${phase.model.name}`
  }
}
