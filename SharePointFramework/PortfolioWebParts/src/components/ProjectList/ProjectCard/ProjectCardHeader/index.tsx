import { DocumentCardTitle } from '@fluentui/react/lib/DocumentCard'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { IProjectCardHeaderProps } from './types'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const context = useContext(ProjectCardContext)
  return (
    <div className={styles.root}>
      <div className={styles.logo} hidden={!context.showProjectLogo}>
        <img
          src={context.project.logo ?? `${context.project.url}/_api/siteiconmanager/getsitelogo`}
          onLoad={props.onImageLoad}
        />
      </div>
      <DocumentCardTitle title={context.project.title} shouldTruncate={true} />
    </div>
  )
}
