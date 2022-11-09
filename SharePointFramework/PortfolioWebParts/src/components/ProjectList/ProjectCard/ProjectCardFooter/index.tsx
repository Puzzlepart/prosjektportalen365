import { DocumentCardActions, Persona, TooltipHost } from '@fluentui/react'
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
        {context.showProjectOwner && owner && (
          <TooltipHost content={<Persona {...owner} hidePersonaDetails={false} />}>
            <Persona {...owner} />
          </TooltipHost>
        )}
        {context.showProjectManager && manager && (
          <TooltipHost content={<Persona {...manager} hidePersonaDetails={false} />}>
            <Persona {...manager} />
          </TooltipHost>
        )}
      </div>
      <DocumentCardActions actions={context.actions} />
    </div>
  )
}
