import { DocumentCardTitle } from '@fluentui/react/lib/DocumentCard'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { IProjectCardHeaderProps } from './types'
import { useProjectCardHeader } from './useProjectCardHeader'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const context = useContext(ProjectCardContext)
  const { getPhaseStyle } = useProjectCardHeader()
  return (
    <div className={styles.root}>
      <div className={styles.logo} hidden={!context.showProjectLogo}>
        <img
          src={context.project.logo ?? `${context.project.url}/_api/siteiconmanager/getsitelogo`}
          onLoad={props.onImageLoad}
        />
      </div>
      <div title={context.project.phase} style={getPhaseStyle()} className={styles.phase}>
        <span className={styles.title}>{context.project?.phase ?? strings.NotSet}</span>
      </div>
      <DocumentCardTitle
        className={styles.title}
        title={context.project.title}
        shouldTruncate={true}
      />
    </div>
  )
}
