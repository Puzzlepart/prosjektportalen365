import { ActionButton, format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import { isEmpty } from 'underscore'
import { ProjectPhasesContext } from '../../../ProjectPhases/context'
import { CHANGE_PHASE } from '../../../ProjectPhases/reducer'
import styles from './ProjectPhaseCallout.module.scss'
import { IProjectPhaseCalloutProps } from './types'

export const ProjectPhaseCallout: FC<IProjectPhaseCalloutProps> = (props) => {
  const context = useContext(ProjectPhasesContext)
  if (!props.target) return null
  const { phase } = props
  const stats = Object.keys(phase.checklistData.stats)
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>{phase.name}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.subText}>{phase.subText}</p>
        <div>
          <div className={styles.stats} hidden={isEmpty(stats)}>
            {stats.map((status, idx) => (
              <div key={idx}>
                <ReactMarkdown>
                  {format(
                    strings.CheckPointsStatus,
                    phase.checklistData.stats[status],
                    status.toLowerCase()
                  )}
                </ReactMarkdown>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            {!isEmpty(phase.checklistData.items) && (
              <ActionButton
                href={phase.getFilteredPhaseChecklistViewUrl(
                  `${context.props.webAbsoluteUrl}/${strings.PhaseChecklistViewUrl}`
                )}
                text={strings.PhaseChecklistLinkText}
                iconProps={{ iconName: 'CheckList' }}
              />
            )}
            {context.state.data.userHasChangePhasePermission && (
              <ActionButton
                onClick={() => context.dispatch(CHANGE_PHASE())}
                text={strings.ChangePhaseText}
                iconProps={{ iconName: 'TransitionPop' }}
                disabled={phase.id === context.state.data?.currentPhase?.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export * from './types'
