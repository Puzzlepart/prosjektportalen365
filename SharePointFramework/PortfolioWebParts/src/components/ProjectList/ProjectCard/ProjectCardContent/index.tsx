import moment from 'moment'
import { Icon } from 'office-ui-fabric-react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardContent.module.scss'

export const ProjectCardContent: FC = () => {
  const context = useContext(ProjectCardContext)
  return (
    <div className={styles.root}>
      <div title={strings.EndDateLabel} className={styles.endDate}>
        <Icon
          className={styles.endDateIcon}
          iconName='Calendar'
          style={
            context.project.endDate && moment(context.project.endDate).isBefore()
              ? { color: '#FF6666' }
              : { color: 'black' }
          }
        />
        <span className={styles.endDateText}>
          {context.project.endDate ? moment(context.project.endDate).format('DD.MM.YYYY') : strings.NotSet}
        </span>
      </div>
    </div>
  )
}
