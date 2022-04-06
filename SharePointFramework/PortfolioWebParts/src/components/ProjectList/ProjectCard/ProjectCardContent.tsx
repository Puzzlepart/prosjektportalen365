import moment from 'moment'
import { Icon } from 'office-ui-fabric-react'
import React from 'react'
import styles from './ProjectCard.module.scss'
import { IProjectCardProps } from './types'

/**
 * Project Card Content
 *
 * @param props Props
 */
export const ProjectCardContent = ({
  project,
  showLifeCycleStatus,
  showServiceArea,
  showType
}: IProjectCardProps): JSX.Element => {
  const _renderLifeCycleStatus = () => {
    if (project.lifecycleStatus) {
      return (
        <div
          className={styles.tag}
          style={
            project.lifecycleStatus === 'Aktivt'
              ? { backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }
              : { backgroundColor: 'rgb(255,0,0,0.5)', color: 'black' }
          }>
          <span>{project.lifecycleStatus}</span>
        </div>
      )
    }
  }

  const _renderServiceAreaText = () => {
    return (
      <>
        {project.serviceArea.map((text, idx) => (
          <div
            key={idx}
            className={styles.tag}
            style={{ backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }}>
            <span>{text}</span>
          </div>
        ))}
      </>
    )
  }

  const _renderTypeText = () => {
    return (
      <>
        {project.type.map((type, idx) => (
          <div
            key={idx}
            className={styles.tag}
            style={{ backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }}>
            <span>{type}</span>
          </div>
        ))}
      </>
    )
  }

  const endDate = moment(project.endDate).format('DD.MM.YYYY')
  return (
    <>
      <div>
        <div className={styles.labels}>
          {showLifeCycleStatus && _renderLifeCycleStatus()}
          {showServiceArea && _renderServiceAreaText()}
          {showType && _renderTypeText()}
        </div>

        <div className={styles.content}>
          <div title='Sluttdato' className={styles.endDate}>
            <Icon
              className={styles.endDateIcon}
              iconName='Calendar'
              style={
                project.endDate && moment(project.endDate).isBefore(moment())
                  ? { color: 'red' }
                  : { color: 'black' }
              }
            />
            <span className={styles.endDateText}>{project.endDate ? endDate : 'Ikke satt'}</span>
          </div>
        </div>
      </div>
    </>
  )
}
