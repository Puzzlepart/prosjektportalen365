import { FluentProvider, SelectTabData, Tab, TabList } from '@fluentui/react-components'
import { SearchBox } from '@fluentui/react-search-preview'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { ProjectListModel, SiteContext, customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { find, isEmpty } from 'underscore'
import { List } from './List'
import { ListContext } from './List/context'
import { ProjectCard } from './ProjectCard'
import { ProjectCardContext } from './ProjectCard/context'
import styles from './ProjectList.module.scss'
import { ProjectListVerticals } from './ProjectListVerticals'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { Toolbar, UserMessage } from 'pp365-shared-library'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const {
    state,
    setState,
    projects,
    verticals,
    onSearch,
    searchBoxPlaceholder,
    createCardContext,
    menuItems
  } = useProjectList(props)

  /**
   * Render projects based on `state.renderMode`.
   *
   * @param projects - Projects to render
   */
  function renderProjects(projects: ProjectListModel[]) {
    switch (state.renderMode) {
      case 'tiles': {
        return projects.map((project, idx) => (
          <ProjectCardContext.Provider key={idx} value={createCardContext(project)}>
            <ProjectCard />
          </ProjectCardContext.Provider>
        ))
      }
      case 'list':
      case 'compactList': {
        const size = state.renderMode === 'list' ? 'medium' : 'extra-small'
        return (
          <ListContext.Provider
            value={{
              ...props,
              projects,
              size
            }}
          >
            <List />
          </ListContext.Provider>
        )
      }
    }
  }

  if (state.projects.length === 0) {
    return (
      <FluentProvider theme={customLightTheme}>
        <section className={styles.root}>
          <UserMessage title={strings.NoProjectsFoundTitle} text={strings.NoProjectsFoundMessage} />
        </section>
      </FluentProvider>
    )
  }

  if (state.error) {
    return (
      <section className={styles.root}>
        <UserMessage title={strings.ErrorFetchingProjectsTitle} text={state.error} intent='error' />
      </section>
    )
  }

  return (
    <FluentProvider className={styles.root} theme={customLightTheme}>
      <div className={styles.tabs}>
        <TabList
          onTabSelect={(_, data: SelectTabData) =>
            setState({ selectedVertical: find(verticals, (v) => v.key === data.value) })
          }
          selectedValue={state.selectedVertical.key}
        >
          {state.isDataLoaded &&
            verticals
              .filter((vertical) => !vertical.isHidden || !vertical.isHidden(state))
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
      <div
        className={styles.commandBar}
      >
        <div className={styles.search} hidden={!props.showSearchBox}>
          <SearchBox
            className={styles.searchBox}
            disabled={!state.isDataLoaded || isEmpty(state.projects)}
            value={state.searchTerm}
            placeholder={searchBoxPlaceholder}
            aria-label={searchBoxPlaceholder}
            title={searchBoxPlaceholder}
            size='large'
            onChange={onSearch}
            contentAfter={{
              onClick: () => setState({ searchTerm: '' })
            }}
            appearance='filled-lighter'
          />
        </div>
        <Toolbar items={menuItems} />
      </div>
      {state.isDataLoaded && isEmpty(projects) && (
        <div className={styles.emptyMessage}>
          <UserMessage
            title={strings.NoProjectsFoundTitle}
            text={strings.ProjectListEmptyMessage}
          />
        </div>
      )}
      <div className={styles.projects}>{renderProjects(projects)}</div>
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
  )
}

ProjectList.defaultProps = {
  sortBy: 'Title',
  showSearchBox: true,
  showSortBy: true,
  defaultRenderMode: 'tiles',
  defaultVertical: 'my_projects',
  verticals: ProjectListVerticals,
  hideVerticals: [],
  showProjectLogo: true,
  projectMetadata: [
    'ProjectOwner',
    'ProjectManager',
    'ProjectServiceArea',
    'ProjectType',
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

export * from './types'
