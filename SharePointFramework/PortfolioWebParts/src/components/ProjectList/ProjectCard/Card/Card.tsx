import React, { FunctionComponent, useState } from 'react'
import styles from './Card.module.scss'
import { IProjectCardProps } from '../types'
import { placeholderImage } from '../../types'
import { DocumentCardActions, DocumentCardTitle } from 'office-ui-fabric-react/lib/DocumentCard'
import { Facepile, IFacepilePersona, PersonaSize } from 'office-ui-fabric-react'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared/lib/helpers'
import moment from 'moment'

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

  const _renderDefaultPersona = () => {
    if (project.owner) {
      return (
        <div>
          <Facepile personaSize={PersonaSize.size32} personas={personas} />
        </div>
      )
    }
  }

  const personas: IFacepilePersona[] = []
  personas.push(ownerPersona)
  personas.push(managerPersona)

  let phaseBgColor = '#343a40'
  let phaseColor = 'black'

  switch (project.phase) {
    case 'Konsept':
    case 'Realisere':
      phaseBgColor = '#68AABC'
      break
    case 'Planlegge':
    case 'Gjennomføre':
    case 'Avslutte':
      phaseBgColor = '#8FB246'
      break
    // default:
    //   phaseBgColor = '#343a40'
  }

  const serviceAreaText =
    project.GtProjectServiceAreaText && project.GtProjectServiceAreaText.split(';')
  const typeText = project.GtProjectTypeText && project.GtProjectTypeText.split(';')

  const _renderServiceAreaText = () => {
    if (serviceAreaText) {
      return (
        <div>
          {serviceAreaText.map((text) => (
            <div className={styles.tag}>{text}</div>
          ))}
        </div>
      )
    }
  }

  const _renderTypeText = () => {
    if (typeText) {
      return (
        <div>
          {typeText.map((type) => {
            return <div className={styles.tag}>{type}</div>
          })}
        </div>
      )
    }
  }

  console.log(serviceAreaText)

  // let startDate = moment(project.startDate).format('DD.MM.YYYY')
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
            ? { backgroundColor: phaseBgColor, color: phaseColor }
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
        <div
          title={project.GtProjectServiceAreaText}
          style={
            project.phase
              ? { backgroundColor: phaseBgColor, color: phaseColor }
              : { backgroundColor: '#C0C0C0', color: 'black' }
          }>
          <span>{_renderServiceAreaText()}</span>
        </div>
        <div
          title={project.GtProjectTypeText}
          style={
            project.phase
              ? { backgroundColor: phaseBgColor, color: phaseColor }
              : { backgroundColor: '#C0C0C0', color: 'black' }
          }>
          <span>{_renderTypeText()}</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* <div title='Startdato' className={styles.startDate}>
          <Icon className={styles.phaseIcon} iconName='Calendar' />
          <span className={styles.text}>{project.startDate ? startDate : 'Ikke satt'}</span>
        </div> */}
        <div title='Sluttdato' className={styles.endDate}>
          {/* Show Calendar icon, with red color if endDate has passed */}
          <Icon
            className={styles.endDateIcon}
            iconName='Calendar'
            style={
              project.endDate && moment(project.endDate).isBefore(moment())
                ? { color: 'red' }
                : { color: 'black' }
            }
          />
          {/* <Icon className={styles.phaseIcon} iconName='Calendar' /> */}
          <span className={styles.endDateText}>{project.endDate ? endDate : 'Ikke satt'}</span>
        </div>
      </div>
      <div className={styles.footer}>
        <Facepile
          personaSize={PersonaSize.size32}
          personas={personas} /*onRenderPersonaCoin={_renderDefaultPersona}*/
        />
        <DocumentCardActions actions={actions} />
      </div>
    </div>
  )
}
