import { IPersonaSharedProps, Persona, PersonaSize } from '@fluentui/react/lib/Persona'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import styles from './ProjectCardContent.module.scss'
import { IProjectCardProps } from '../types'

/**
 * Project Card Content
 *
 * @param props Props
 */
export const ProjectCardContent: FC<IProjectCardProps> = ({
  project,
  showProjectOwner,
  showProjectManager
}) => {
  const defaultPersonaProps: IPersonaSharedProps = {
    text: strings.NotSet,
    size: PersonaSize.size40,
    imageShouldFadeIn: true
  }
  const ownerPersonaProps = {
    ...defaultPersonaProps,
    ...project.owner,
    secondaryText: strings.ProjectOwner
  }
  const managerPersonaProps = {
    ...defaultPersonaProps,
    ...project.manager,
    secondaryText: strings.ProjectManager
  }
  return (
    <div className={styles.root}>
      <div className={styles.phase}>{project.phase || strings.NotSet}</div>
      <div className={styles.personaContainer} hidden={!showProjectOwner}>
        <Persona {...ownerPersonaProps} />
      </div>
      <div className={styles.personaContainer} hidden={!showProjectManager}>
        <Persona {...managerPersonaProps} />
      </div>
    </div>
  )
}
