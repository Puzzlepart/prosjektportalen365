import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { CHANGE_PHASE, DISMISS_CALLOUT } from 'components/ProjectPhases/reducer'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext } from 'react'
import { isEmpty } from 'underscore'
import styles from './ProjectPhaseCallout.module.scss'
import { IProjectPhaseCalloutProps } from './types'

export const ProjectPhaseCallout = ({ phase, target }: IProjectPhaseCalloutProps) => {
  if (!target) return null
  const context = useContext(ProjectPhasesContext)
  const stats = Object.keys(phase.checklistData.stats)

  return (
    <Callout
      gapSpace={5}
      target={target}
      onDismiss={() => context.dispatch(DISMISS_CALLOUT())}
      setInitialFocus={true}>
      <div className={styles.projectPhaseCallout}>
        <div className={styles.header}>
          <span className={styles.title}>{phase.name}</span>
        </div>
        <div className={styles.body}>
          <p className={styles.subText} hidden={!context.props.showSubText}>{phase.subText}</p>
          <div>
            <div
              className={styles.stats}
              hidden={isEmpty(stats)}>
              {stats.map((status, idx) => {
                return (
                  <div key={idx}>
                    <span>
                      {phase.checklistData.stats[status]} {strings.CheckPointsMarkedAsText}{' '}
                      {status}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className={styles.actions}>
              <ActionButton
                href={phase.getFilteredPhaseChecklistViewUrl(`${context.props.webUrl}/${strings.PhaseChecklistViewUrl}`)}
                text={strings.PhaseChecklistLinkText}
                iconProps={{ iconName: 'CheckList' }} />
              <ActionButton
                onClick={() => context.dispatch(CHANGE_PHASE())}
                text={strings.ChangePhaseText}
                iconProps={{ iconName: 'TransitionPop' }}
                disabled={phase.id === context.state.data?.currentPhase?.id || !context.props.isSiteAdmin}
              />
            </div>
          </div>
        </div>
      </div>
    </Callout>
  )
}

export * from './types'
