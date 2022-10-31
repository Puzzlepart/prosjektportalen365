import { DocumentCardTitle } from '@fluentui/react/lib/DocumentCard'
import React, { FC } from 'react'
import styles from './ProjectCardHeader.module.scss'
import { IProjectCardHeaderProps } from './types'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  return (
    <div className={styles.root}>
      <div className={styles.logo} hidden={!props.showProjectLogo}>
        <img
          src={props.project.logo ?? `${props.project.url}/_api/siteiconmanager/getsitelogo`}
          onLoad={props.onImageLoad}
        />
      </div>
      <DocumentCardTitle title={props.project.title} shouldTruncate={props.shouldTruncateTitle} />
    </div>
  )
}
