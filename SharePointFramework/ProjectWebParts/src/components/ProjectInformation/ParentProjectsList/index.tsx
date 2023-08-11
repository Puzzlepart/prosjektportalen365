import { Icon, Link } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './ParentProjectsList.module.scss'

export const ParentProjectsList: FC = () => {
  const context = useProjectInformationContext()
  const projects = context.state?.data?.parentProjects || []
  if (context.props.hideParentProjects || isEmpty(projects)) return null
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span role='heading' aria-level={3}>
          {strings.ParentProjectsHeaderText}
        </span>
      </div>
      {projects.map((p, index) => (
        <div key={index} className={styles.projectItem}>
          <Icon iconName={p.iconName} className={styles.icon} />
          <Link href={p.url} className={styles.link} rel='noopener noreferrer' target='_blank'>
            {p.title}
          </Link>
        </div>
      ))}
    </div>
  )
}
