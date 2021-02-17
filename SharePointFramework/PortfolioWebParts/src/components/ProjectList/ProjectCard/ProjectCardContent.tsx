import { IPersonaSharedProps, Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona'
import React from 'react'
import { IProjectCardProps } from './IProjectCardProps'
import styles from './ProjectCard.module.scss'
import * as strings from 'PortfolioWebPartsStrings'

/**
 * Project Card Content
 *
 * @param {IProjectCardProps} props Props
 */
// tslint:disable-next-line: naming-convention
export const ProjectCardContent = ({
  project,
  showProjectOwner,
  showProjectManager
}: IProjectCardProps): JSX.Element => {
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
    <div>
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
