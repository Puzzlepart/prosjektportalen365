import moment from 'moment'
import { Icon, IPersonaSharedProps, Persona, PersonaSize } from 'office-ui-fabric-react'
import { DocumentCardActions, DocumentCardTitle } from 'office-ui-fabric-react/lib/DocumentCard'
import strings from 'PortfolioWebPartsStrings'
import React, { FunctionComponent } from 'react'
import { placeholderImage } from '../types'
import styles from './ProjectCard.module.scss'
import { ProjectLifecycleStatus } from './ProjectLifecycleStatus'
import { ProjectServiceArea } from './ProjectServiceArea'
import { ProjectType } from './ProjectType'
import { IProjectCardProps } from './types'

export const ProjectCard: FunctionComponent<IProjectCardProps> = ({
  project,
  actions,
  showProjectOwner,
  showProjectManager,
  showLifeCycleStatus,
  showServiceArea,
  showType,
  phaseLevel
}) => {


  const ownerPersona: IPersonaSharedProps = {
    title: project.owner
      ? `${project.owner.text} | ${strings.ProjectOwner}`
      : 'Prosjekteier ikke satt',
    imageUrl: project.owner ? project.owner.imageUrl : null
  }
  const managerPersona: IPersonaSharedProps = {
    title: project.manager
      ? `${project.manager.text} | ${strings.ProjectManager}`
      : 'Prosjektleder ikke satt',
    imageUrl: project.manager ? project.manager.imageUrl : null
  }

  const _setPhaseColor = (phaseLevel) => {
    switch (phaseLevel) {
      case 'Portfolio':
        return 'rgb(0,114,198,0.8)'
      case 'Project':
        return 'rgb(51,153,51,0.8)'
      default:
        return 'grey'
    }
  }
  return (
    <a href={project.userIsMember ? project.url : null} style={{ textDecoration: 'none' }}>
      <div
        className={styles.root}
        style={!project.userIsMember ? { opacity: '50%', cursor: 'default' } : {}}>
        <div className={styles.logo}>
          <img src={project.logo ?? placeholderImage} />
        </div>
        <div
          title={project.phase}
          style={{ backgroundColor: _setPhaseColor(phaseLevel), color: 'white' }}
          className={styles.phaseLabel}>
          <span className={styles.phaseLabelTitle}>
            {project.phase ? project.phase : 'Ikke satt'}
          </span>
        </div>
        <DocumentCardTitle
          className={styles.title}
          title={project.title}
          shouldTruncate={true}
        />
        <hr />
        <div>
          <div className={styles.labels}>
            <ProjectLifecycleStatus
              hidden={!showLifeCycleStatus}
              lifecycleStatus={project.lifecycleStatus} />
            <ProjectServiceArea
              hidden={!showServiceArea}
              serviceArea={project.serviceArea} />
            <ProjectType
              hidden={!showType}
              type={project.type} />
          </div>
          <div className={styles.content}>
            <div title='Sluttdato' className={styles.endDate}>
              <Icon
                className={styles.endDateIcon}
                iconName='Calendar'
                style={
                  project.endDate && moment(project.endDate).isBefore(moment())
                    ? { color: 'red' }
                    : { color: 'black' }
                }
              />
              <span className={styles.endDateText}>{project.endDate ? moment(project.endDate).format('DD.MM.YYYY') : 'Ikke satt'}</span>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.persona}>
            {showProjectOwner && project.owner && (
              <Persona {...ownerPersona} size={PersonaSize.size40} hidePersonaDetails />
            )}
            {showProjectManager && project.manager && (
              <Persona {...managerPersona} size={PersonaSize.size40} hidePersonaDetails />
            )}
          </div>
          <DocumentCardActions actions={actions} />
        </div>
      </div>
    </a>
  )
}
