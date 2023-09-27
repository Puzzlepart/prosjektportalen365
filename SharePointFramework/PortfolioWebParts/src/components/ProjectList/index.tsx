import {
  SelectTabData,
  Tab,
  TabList
} from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { SearchBox } from '@fluentui/react-search-preview'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { Themed, Toolbar } from 'pp365-shared-library'
import { ProjectListModel, SiteContext } from 'pp365-shared-library/lib/models'
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
      <Themed>
        <section className={styles.root}>
          <Alert intent='info'>{strings.NoProjectsFoundMessage}</Alert>
        </section>
      </Themed>
    )
  }

  if (state.error) {
    return (
      <section className={styles.root}>
        <Alert intent='error'>{strings.ErrorText}</Alert>
      </section>
    )
  }

  return (
    <Themed className={styles.root}>
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
        hidden={!props.showSearchBox && !props.showRenderModeSelector}
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
            appearance='filled-lighter'
          />
        </div>
        <div hidden={!props.showRenderModeSelector && !props.showSortBy}>
          <Toolbar items={menuItems} />
        </div>
      </div>
      {state.isDataLoaded && isEmpty(projects) && (
        <div className={styles.emptyMessage}>
          <Alert intent='info'>{strings.ProjectListEmptyText}</Alert>
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
    </Themed>
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
