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
  actions
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

  let phaseBgColor = '#343a40'

  switch (project.phase) {
    case 'Konsept':
    case 'Realisere':
      phaseBgColor = 'rgb(0,114,198,0.8)'
      break
    case 'Planlegge':
    case 'Gjennomføre':
    case 'Avslutte':
      phaseBgColor = 'rgb(51,153,51,0.8)'
      break
    // default:
    //   phaseBgColor = '#343a40'
  }

  const serviceAreaText =
    project.GtProjectServiceAreaText && project.GtProjectServiceAreaText.split(';')
  const typeText = project.GtProjectTypeText && project.GtProjectTypeText.split(';')

  const _renderLifeCycleStatus = () => {
    if (project.GtProjectLifecycleStatus) {
      return (
        <div
          className={styles.tag}
          style={{ backgroundColor: 'rgb(234,163,0,0.6)', color: 'black' }}>
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
              style={{ backgroundColor: 'rgb(234,163,0,0.6)', color: 'black' }}>
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
              style={{ backgroundColor: 'rgb(234,163,0,0.6)', color: 'black' }}>
              <span>{type}</span>
            </div>
          ))}
        </>
      )
    }
  }

  let endDate = moment(project.endDate).format('DD.MM.YYYY')

  return (
    <div
      className={styles.card}
      style={!project.userIsMember ? { opacity: '50%', cursor: 'default' } : {}}
      onClick={project.userIsMember ? () => window.open(project.url, '_self') : null}>
      <img className={styles.logo} src={project.logo ?? placeholderImage} />
      <div
        title={project.phase}
        style={
          project.phase
            ? { backgroundColor: phaseBgColor, color: 'white' }
            : { backgroundColor: '#C0C0C0', color: 'black' }
        }
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
        {_renderLifeCycleStatus()}
        {_renderServiceAreaText()}
        {_renderTypeText()}
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
          {project.owner && (
            <Persona {...ownerPersona} size={PersonaSize.size40} hidePersonaDetails />
          )}
          {project.manager && (
            <Persona {...managerPersona} size={PersonaSize.size40} hidePersonaDetails />
          )}
        </div>
        <DocumentCardActions actions={actions} />
      </div>
    </div>
  )
}
