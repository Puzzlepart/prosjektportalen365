import {
  FluentProvider,
  IdPrefixProvider,
  SelectTabData,
  Tab,
  TabList
} from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { SiteContext, UserMessage, customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { find, isEmpty } from 'underscore'
import styles from './ProjectList.module.scss'
import { ProjectListVerticals } from './ProjectListVerticals'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { useProjectListRenderer } from './useProjectListRenderer'
import { ProjectListContext } from './context'
import { Commands } from './Commands'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const context = useProjectList(props)
  const renderProjects = useProjectListRenderer(context)

  if (context.state.projects.length === 0) {
    return (
      <FluentProvider theme={customLightTheme}>
        <section className={styles.projectList}>
          <UserMessage title={strings.NoProjectsFoundTitle} text={strings.NoProjectsFoundMessage} />
        </section>
      </FluentProvider>
    )
  }

  if (context.state.error) {
    return (
      <FluentProvider theme={customLightTheme}>
        <section className={styles.projectList}>
          <UserMessage
            title={strings.ErrorFetchingProjectsTitle}
            text={context.state.error}
            intent='error'
          />
        </section>
      </FluentProvider>
    )
  }

  return (
    <ProjectListContext.Provider value={context}>
      <IdPrefixProvider value={context.fluentProviderId}>
        <FluentProvider className={styles.projectList} theme={customLightTheme}>
          <div className={styles.tabs}>
            <TabList
              onTabSelect={(_, data: SelectTabData) =>
                context.setState({
                  selectedVertical: find(context.verticals, (v) => v.key === data.value)
                })
              }
              selectedValue={context.state.selectedVertical.key}
            >
              {context.state.isDataLoaded &&
                context.verticals
                  .filter((vertical) => !vertical.isHidden || !vertical.isHidden(context.state))
                  .map((vertical) => {
                    const Icon = vertical.icon
                    return (
                      <Tab key={vertical.key} value={vertical.value} icon={<Icon />}>
                        {vertical.text}
                      </Tab>
                    )
                  })}
            </TabList>
          </div>
          <Commands />
          {context.state.isDataLoaded && isEmpty(context.projects) && (
            <div className={styles.emptyMessage}>
              <UserMessage
                title={strings.NoProjectsFoundTitle}
                text={strings.ProjectListEmptyMessage}
              />
            </div>
          )}
          <div className={styles.projects}>{renderProjects(context.projects)}</div>
          <ProjectInformationPanel
            {...SiteContext.create(
              props.spfxContext,
              context.state.showProjectInfo?.siteId,
              context.state.showProjectInfo?.url
            )}
            page='Portfolio'
            hidden={!context.state.showProjectInfo}
            hideAllActions={true}
            panelProps={{
              headerText: context.state.showProjectInfo?.title,
              onDismiss: () => {
                context.setState({ showProjectInfo: null })
              }
            }}
          />
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectListContext.Provider>
  )
}

ProjectList.defaultProps = {
  sortBy: 'Title',
  showSearchBox: true,
  showRenderModeSelector: true,
  showSortBy: true,
  defaultRenderMode: 'tiles',
  defaultVertical: 'my_projects',
  verticals: ProjectListVerticals,
  hideVerticals: [],
  useDynamicColors: true,
  showProjectLogo: true,
  primaryField: 'GtProjectServiceAreaText',
  secondaryField: 'GtProjectTypeText',
  primaryUserField: 'GtProjectOwner',
  secondaryUserField: 'GtProjectManager',
  projectMetadata: [
    'PrimaryField',
    'SecondaryField',
    'PrimaryUserField',
    'SecondaryUserField',
    'ProjectPhase'
  ],
  quickLaunchMenu: [
    {
      order: 10,
      text: 'Prosjektstatus',
      relativeUrl: '/SitePages/Prosjektstatus.aspx'
    },
    {
      order: 20,
      text: 'Dokumentbibliotek',
      relativeUrl: '/Delte%20dokumenter'
    },
    {
      order: 30,
      text: 'Fasesjekkliste',
      relativeUrl: '/Lists/Fasesjekkliste'
    },
    {
      order: 40,
      text: 'Oppgaver',
      relativeUrl: '/SitePages/Oppgaver.aspx'
    }
  ]
}
