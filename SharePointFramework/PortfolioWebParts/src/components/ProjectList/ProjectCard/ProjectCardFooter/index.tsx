import { DocumentCardActions, Persona } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardFooter.module.scss'
import { useProjectCardFooter } from './useProjectCardFooter'

export const ProjectCardFooter: FC = () => {
  const context = useContext(ProjectCardContext)
  const { owner, manager } = useProjectCardFooter()
  return (
    <div className={styles.root}>
      <div className={styles.persona}>
        {context.showProjectOwner && owner && <Persona {...owner} />}
        {context.showProjectManager && manager && <Persona {...manager} />}
      </div>
      <DocumentCardActions actions={context.actions} />
    </div>
  )
}
