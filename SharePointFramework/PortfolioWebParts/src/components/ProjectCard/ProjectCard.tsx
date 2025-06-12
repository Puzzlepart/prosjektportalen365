import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContext } from './context'
import { IProjectCardProps } from './types'
import { useProjectCard } from './useProjectCard'
import {
  FluentProvider,
  IdPrefixProvider,
} from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  const {
    context,
    fluentProviderId
  } = useProjectCard(props)

  return (
    <ProjectCardContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={styles.projectCard}>
            <h1>Prosjektkort</h1>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectCardContext.Provider>
  )
}

ProjectCard.defaultProps = {}
