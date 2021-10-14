import { DocumentCardTitle } from 'office-ui-fabric-react/lib/DocumentCard'
import React, { FunctionComponent } from 'react'
import ImageFadeIn from 'react-image-fade-in'
import { placeholderImage } from '../types'
import styles from './ProjectCard.module.scss'
import { IProjectCardProps } from './types'

export const ProjectCardHeader: FunctionComponent<IProjectCardProps> = ({
  project,
  showProjectLogo,
  shouldTruncateTitle
}: IProjectCardProps) => {
  return (
    <div className={styles.header}>
      <div className={styles.logo} hidden={!showProjectLogo}>
        <ImageFadeIn opacityTransition={1.5} src={project.logo ?? placeholderImage} />
      </div>
      <DocumentCardTitle title={project.title} shouldTruncate={shouldTruncateTitle} />
    </div>
  )
}
