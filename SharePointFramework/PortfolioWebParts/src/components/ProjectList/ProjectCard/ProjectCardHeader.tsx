import { DocumentCardTitle } from 'office-ui-fabric-react/lib/DocumentCard'
import * as React from 'react'
import ImageFadeIn from 'react-image-fade-in'
import { IProjectCardProps } from './IProjectCardProps'
import styles from './ProjectCard.module.scss'

/**
 * Project Card Header
 * 
 * @param {IProjectCardProps} props Props 
 */
// tslint:disable-next-line: naming-convention
export const ProjectCardHeader = ({ project, showProjectLogo, shouldTruncateTitle }: IProjectCardProps): JSX.Element => {
    return (
        <div className={styles.header}>
            <div className={styles.logo} hidden={!showProjectLogo}>
                {project.logo && <ImageFadeIn opacityTransition={2.5} src={project.logo} />}
            </div>
            <DocumentCardTitle title={project.title} shouldTruncate={shouldTruncateTitle} />
        </div>
    )
}