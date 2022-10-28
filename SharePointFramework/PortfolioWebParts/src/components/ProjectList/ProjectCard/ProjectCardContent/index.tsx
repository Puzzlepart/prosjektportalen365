import { IPersonaSharedProps, Persona, PersonaSize } from '@fluentui/react/lib/Persona'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { IProjectCardProps } from '../types'
import styles from './ProjectCardContent.module.scss'

function useProjectCardContent(props: IProjectCardProps) {
  const defaultPersonaProps: IPersonaSharedProps = {
    text: strings.NotSet,
    size: PersonaSize.size40,
    imageShouldFadeIn: true
  }
  const ownerPersonaProps: IPersonaSharedProps = {
    ...defaultPersonaProps,
    ...props.project.owner,
    secondaryText: strings.ProjectOwner
  }
  const managerPersonaProps: IPersonaSharedProps = {
    ...defaultPersonaProps,
    ...props.project.manager,
    secondaryText: strings.ProjectManager
  }
  return {
    phase: props.project.phase,
    owner: ownerPersonaProps,
    manager: managerPersonaProps
  } as const
}

export const ProjectCardContent: FC<IProjectCardProps> = (props) => {
  const { phase, owner, manager } = useProjectCardContent(props)
  return (
    <div className={styles.root}>
      <div className={styles.phase}>{phase}</div>
      <div className={styles.personaContainer} hidden={!props.showProjectOwner}>
        <Persona {...owner} />
      </div>
      <div className={styles.personaContainer} hidden={!props.showProjectManager}>
        <Persona {...manager} />
      </div>
    </div>
  )
}
