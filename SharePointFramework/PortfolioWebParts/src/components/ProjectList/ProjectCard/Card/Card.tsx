import React, { FunctionComponent, useState } from 'react'
import styles from './Card.module.scss'
import { IProjectCardProps } from '../types'
import { placeholderImage } from '../../types'
import { DocumentCardActions, DocumentCardTitle } from 'office-ui-fabric-react/lib/DocumentCard'
import { IPersonaSharedProps, Persona, PersonaSize } from 'office-ui-fabric-react'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import strings from 'PortfolioWebPartsStrings'
import moment from 'moment'

export const Card: FunctionComponent<IProjectCardProps> = ({
  project,
  shouldTruncateTitle,
  actions,
  showProjectOwner,
  showProjectManager,
  showLifeCycleStatus,
  showServiceArea,
  showType,
  phaseLevel
}: IProjectCardProps) => {
  const ownerPersona: IPersonaSharedProps = {
    title: project.owner
      ? `${project.owner.text} | ${strings.ProjectOwner}`
      : `Prosjekteier ikke satt`,
    imageUrl: project.owner ? project.owner.imageUrl : null
  }
  const managerPersona: IPersonaSharedProps = {
    title: project.manager
      ? `${project.manager.text} | ${strings.ProjectManager}`
      : `Prosjektleder ikke satt`,
    imageUrl: project.manager ? project.manager.imageUrl : null
  }

  const serviceAreaText =
    project.GtProjectServiceAreaText && project.GtProjectServiceAreaText.split(';')
  const typeText = project.GtProjectTypeText && project.GtProjectTypeText.split(';')

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

  const _renderLifeCycleStatus = () => {
    if (project.GtProjectLifecycleStatus) {
      return (
        <div
          className={styles.tag}
          style={
            project.GtProjectLifecycleStatus == 'Aktivt'
              ? { backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }
              : { backgroundColor: 'rgb(255,0,0,0.5)', color: 'black' }
          }>
          <span>{project.GtProjectLifecycleStatus}</span>
        </div>
      )
    }
  }

  const _renderServiceAreaText = () => {
    if (serviceAreaText) {
      return (
        <>
          {serviceAreaText.map((text) => (
            <div
              className={styles.tag}
              style={{ backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }}>
              <span>{text}</span>
            </div>
          ))}
        </>
      )
    }
  }

  const _renderTypeText = () => {
    if (typeText) {
      return (
        <>
          {typeText.map((type) => (
            <div
              className={styles.tag}
              style={{ backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }}>
              <span>{type}</span>
            </div>
          ))}
        </>
      )
    }
  }

  let endDate = moment(project.endDate).format('DD.MM.YYYY')

  return (
    <a href={project.userIsMember ? project.url : null} style={{ textDecoration: 'none' }}>
      <div
        className={styles.card}
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
          shouldTruncate={shouldTruncateTitle}
        />
        <hr />
        <div className={styles.labels}>
          {showLifeCycleStatus && _renderLifeCycleStatus()}
          {showServiceArea && _renderServiceAreaText()}
          {showType && _renderTypeText()}
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
            <span className={styles.endDateText}>{project.endDate ? endDate : 'Ikke satt'}</span>
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
