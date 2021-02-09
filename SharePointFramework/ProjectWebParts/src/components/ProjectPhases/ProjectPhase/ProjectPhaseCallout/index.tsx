import { Callout } from 'office-ui-fabric-react/lib/Callout'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
import { isEmpty } from 'underscore'
import styles from './ProjectPhaseCallout.module.scss'
import { IProjectPhaseCalloutProps } from './types'

export const ProjectPhaseCallout = ({
  phase,
  target,
  onDismiss
}: IProjectPhaseCalloutProps) => {
  const stats = Object.keys(phase.checklistData.stats)

  return (
    <Callout
      gapSpace={5}
      target={target}
      onDismiss={onDismiss}
      setInitialFocus={true}
      hidden={false}>
      <div className={styles.projectPhaseCallout}>
        <div className={styles.header}>
          <span className={styles.title}>{phase.name}</span>
        </div>
        <div className={styles.body}>
          <p className={styles.subText}>{phase.subText}</p>
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
              {/* <ActionButton
                href={phase.getFilteredPhaseChecklistViewUrl(`${webUrl}/${strings.PhaseChecklistViewUrl}`)}
                text={strings.PhaseChecklistLinkText}
                iconProps={{ iconName: 'CheckList' }}
              />
              <ActionButton
                onClick={() => onChangePhase(phase.model)}
                text={strings.ChangePhaseText}
                iconProps={{ iconName: 'TransitionPop' }}
                disabled={isCurrentPhase || !isSiteAdmin}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </Callout>
  )
}

export * from './types'
