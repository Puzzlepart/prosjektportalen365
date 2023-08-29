import { Icon, Link } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './ParentProjectsList.module.scss'
import { WebPartTitle } from 'pp365-shared-library'

export const ParentProjectsList: FC = () => {
  const context = useProjectInformationContext()
  const projects = context.state?.data?.parentProjects || []
  if (context.props.hideParentProjects || isEmpty(projects)) return null
  return (
    <div className={styles.root}>
      <WebPartTitle title={strings.ParentProjectsHeaderText} />
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
