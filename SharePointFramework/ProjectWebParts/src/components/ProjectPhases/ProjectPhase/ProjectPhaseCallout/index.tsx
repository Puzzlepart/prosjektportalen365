import React from 'react'
import { Callout } from 'office-ui-fabric-react/lib/Callout'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { IProjectPhaseCalloutProps } from './types'
import styles from './ProjectPhaseCallout.module.scss'
import * as strings from 'ProjectWebPartsStrings'
import { isEmpty } from 'underscore'

export const ProjectPhaseCallout = ({
  phase,
  webUrl,
  isCurrentPhase,
  isSiteAdmin,
  onChangePhase,
  onDismiss
}: IProjectPhaseCalloutProps) => {
  const stats = Object.keys(phase.model.checklistData.stats)

  return (
    <Callout
      gapSpace={5}
      target={phase.target}
      onDismiss={onDismiss}
      setInitialFocus={true}
      hidden={false}>
      <div className={styles.projectPhaseCallout}>
        <div className={styles.header}>
          <span className={styles.title}>{phase.model.name}</span>
        </div>
        <div className={styles.body}>
          <p className={styles.subText}>{phase.model.subText}</p>
          <div>
            <div
              className={styles.stats}
              hidden={isEmpty(stats)}>
              {stats.map((status, idx) => {
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
                href={phase.model.getFilteredPhaseChecklistViewUrl(`${webUrl}/${strings.PhaseChecklistViewUrl}`)}
                text={strings.PhaseChecklistLinkText}
                iconProps={{ iconName: 'CheckList' }}
              />
              <ActionButton
                onClick={() => onChangePhase(phase.model)}
                text={strings.ChangePhaseText}
                iconProps={{ iconName: 'TransitionPop' }}
                disabled={isCurrentPhase || !isSiteAdmin}
              />
            </div>
          </div>
        </div>
      </div>
    </Callout>
  )
}

export * from './types'