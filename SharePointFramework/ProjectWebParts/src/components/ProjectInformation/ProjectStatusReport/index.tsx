import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'
import styles from './ProjectStatusReport.module.scss'

export const ProjectStatusReport: FC = () => {
  const context = useContext(ProjectInformationContext)
  // eslint-disable-next-line no-console
  console.log(context.props.hideStatusReport)
  // if (context.props.hideParentProjects || isEmpty(projects)) return null
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span role='heading' aria-level={3}>
          {strings.ProjectStatusReportHeaderText}
        </span>
      </div>
    </div>
  )
}
