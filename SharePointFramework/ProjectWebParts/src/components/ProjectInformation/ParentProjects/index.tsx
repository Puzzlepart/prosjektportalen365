import { Icon, Link } from 'office-ui-fabric-react'
import strings from 'ProjectWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'
import { ProjectInformationContext } from '../context'
import styles from './ParentProjects.module.scss'

export const ParentProjects: FunctionComponent = () => {
  const context = useContext(ProjectInformationContext)
  const projects = (context.state?.data?.parentProjects || [])
  return (
    <div
      hidden={projects.length === 0}
      className={styles.root}>
      <div className={styles.header}>
        <span role='heading' aria-level={3}>{strings.ParentProjectsHeaderText}</span>
      </div>
      {projects.map((p, index) => (
        <div key={index} className={styles.projectItem}>
          <Icon iconName={p.iconName} className={styles.icon} />
          <Link href={p.url} className={styles.link}>{p.title}</Link>
        </div>
      ))}
    </div>
  )
}
