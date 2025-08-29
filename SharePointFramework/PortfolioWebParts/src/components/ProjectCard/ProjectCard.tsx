import React, { FC } from 'react'
import { ProjectCardContext } from '../ProjectList/ProjectCard/context'
import { IProjectCardProps } from './types'
import { useProjectCard } from './useProjectCard'
import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { ProjectCard as ProjectNewsCard } from '../ProjectList/ProjectCard'
import { customLightTheme, SiteContext } from 'pp365-shared-library'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import resource from 'SharedResources'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  const { state, setState, createCardContext, fluentProviderId } = useProjectCard(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        {state.isDataLoaded && (
          <ProjectCardContext.Provider value={createCardContext(state.project)}>
            <ProjectNewsCard />
          </ProjectCardContext.Provider>
        )}
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
  primaryField: 'GtProjectServiceAreaText',
  secondaryField: 'GtProjectTypeText',
  primaryUserField: 'GtProjectOwner',
  secondaryUserField: 'GtProjectManager',
  projectMetadata: [
    'PrimaryUserField',
    'SecondaryUserField',
    'PrimaryField',
    'SecondaryField',
    'ProjectPhase'
  ],
  quickLaunchMenu: [
    {
      order: 10,
      text: resource.Navigation_ProjectStatus_Title,
      relativeUrl: `/${resource.Navigation_ProjectStatus_Url}`
    },
    {
      order: 20,
      text: resource.Navigation_Documents_Title,
      relativeUrl: `/${resource.Navigation_Documents_Url}`
    },
    {
      order: 30,
      text: resource.Navigation_PhaseChecklist_Title,
      relativeUrl: `/${resource.Navigation_PhaseChecklist_Url}`
    },
    {
      order: 40,
      text: resource.Navigation_Tasks_Title,
      relativeUrl: `/${resource.Navigation_Tasks_Url}`
    }
  ]
}
