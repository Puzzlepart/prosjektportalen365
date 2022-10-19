import { DocumentCardTitle } from '@fluentui/react/lib/DocumentCard'
import React, { FunctionComponent, useState } from 'react'
import styles from './ProjectCard.module.scss'
import { IProjectCardProps } from './types'

export const ProjectCardHeader: FunctionComponent<IProjectCardProps> = ({
  project,
  showProjectLogo,
  shouldTruncateTitle
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  return (
    <div className={styles.header}>
      <div className={styles.logo} hidden={!showProjectLogo}>
        <img
          className={isLoaded && styles.isLoaded}
          src={project.logo ?? `${project.url}/_api/siteiconmanager/getsitelogo`}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      <DocumentCardTitle title={project.title} shouldTruncate={shouldTruncateTitle} />
    </div>
  )
}
