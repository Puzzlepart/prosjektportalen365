import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContext } from '../ProjectList/ProjectCard/context'
import { IProjectCardProps } from './types'
import { useProjectCard } from './useProjectCard'
import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { ProjectCard as ProjectNewsCard } from '../ProjectList/ProjectCard'
import { customLightTheme, SiteContext } from 'pp365-shared-library'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  const { state, setState, createCardContext, fluentProviderId } = useProjectCard(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.projectCard}>
          {state.isDataLoaded && (
            <ProjectCardContext.Provider value={createCardContext(state.project)}>
              <ProjectNewsCard />
            </ProjectCardContext.Provider>
          )}
        </div>
        <ProjectInformationPanel
          {...SiteContext.create(
            props.spfxContext,
            state.showProjectInfo?.siteId,
            state.showProjectInfo?.url
          )}
          page='Portfolio'
          hidden={!state.showProjectInfo}
          hideAllActions={true}
          panelProps={{
            headerText: state.showProjectInfo?.title,
            onDismiss: () => {
              setState({ showProjectInfo: null })
            }
          }}
        />
      </FluentProvider>
    </IdPrefixProvider>
  )
}

ProjectCard.defaultProps = {
  useDynamicColors: true,
  showProjectLogo: true,
  projectMetadata: [
    'ProjectOwner',
    'ProjectManager',
    'ProjectServiceArea',
    'ProjectType',
    'ProjectPhase'
  ]
}
