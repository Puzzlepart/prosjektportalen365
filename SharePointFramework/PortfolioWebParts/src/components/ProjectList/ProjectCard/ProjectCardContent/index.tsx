import { Persona } from '@fluentui/react/lib/Persona'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardContent.module.scss'
import { useProjectCardContent } from './useProjectCardContent'

export const ProjectCardContent: FC = () => {
  const context = useContext(ProjectCardContext)
  const { phase, owner, manager } = useProjectCardContent()
  return (
    <div className={styles.root}>
      <div className={styles.phase}>{phase}</div>
      <div
        className={styles.personaContainer}
        hidden={!context.showProjectOwner}
      >
        <Persona {...owner} />
      </div>
      <div
        className={styles.personaContainer}
        hidden={!context.showProjectManager}
      >
        <Persona {...manager} />
      </div>
    </div>
  )
}
