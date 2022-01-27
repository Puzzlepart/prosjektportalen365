import React, { FunctionComponent, useState } from 'react'
import styles from './Card.module.scss'
import { IProjectCardProps } from '../types'
import { placeholderImage } from '../../types'
import { DocumentCardActions, DocumentCardTitle } from 'office-ui-fabric-react/lib/DocumentCard'
import { Facepile, IFacepilePersona, PersonaSize } from 'office-ui-fabric-react'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import strings from 'PortfolioWebPartsStrings'

export const Card: FunctionComponent<IProjectCardProps> = ({
  project,
  shouldTruncateTitle,
  actions
}: IProjectCardProps) => {
  const ownerPersona = {
    personaName: project.owner
      ? `${project.owner.text} | ${strings.ProjectOwner}`
      : `Prosjekteier ikke satt`,
    imageUrl: project.owner ? project.owner.imageUrl : null,
    title: strings.ProjectOwner
  }
  const managerPersona = {
    personaName: project.manager
      ? `${project.manager.text} | ${strings.ProjectManager}`
      : `Prosjektleder ikke satt`,
    imageUrl: project.manager ? project.manager.imageUrl : null,
    title: strings.ProjectManager
  }

  const personas: IFacepilePersona[] = []
  personas.push(ownerPersona)
  personas.push(managerPersona)

  return (
    <div className={styles.card} style={!project.userIsMember ? {opacity: '50%', cursor: 'default'} : {}} onClick={project.userIsMember ? () => window.open(project.url, "_self") : null}>
      <img className={styles.logo} src={project.logo ?? placeholderImage} />
      <DocumentCardTitle
        className={styles.title}
        title={project.title}
        shouldTruncate={shouldTruncateTitle}
      />
      <hr />
      <div className={styles.content}>
        <div className={styles.phase}>
          <Icon className={styles.phaseIcon} iconName='AlarmClock' />
          <p className={styles.text}>{project.phase ? project.phase : 'Ikke satt'}</p>
        </div>
      </div>
      <div className={styles.footer}>
        <Facepile personaSize={PersonaSize.size32} personas={personas} />
        <DocumentCardActions actions={actions} />
      </div>
    </div>
  )
}
