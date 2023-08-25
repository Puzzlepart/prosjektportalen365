import {
  Button,
  FluentProvider,
  SelectTabData,
  Tab,
  TabList,
  Tooltip,
  webLightTheme
} from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { TextSortAscendingRegular, TextSortDescendingRegular } from '@fluentui/react-icons'
import { SearchBox } from '@fluentui/react-search-preview'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { ProjectListModel, SiteContext } from 'pp365-shared-library/lib/models'
import React, { FC } from 'react'
import { find, isEmpty } from 'underscore'
import { List } from './List'
import { ListContext } from './List/context'
import { ProjectCard } from './ProjectCard'
import { ProjectCardContext } from './ProjectCard/context'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { ProjectListVerticals } from './ProjectListVerticals'
import { RenderModeDropdown } from './RenderModeDropdown'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { format } from '@fluentui/react'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const {
    state,
    setState,
    projects,
    verticals,
    onListSort,
    onSearch,
    searchBoxPlaceholder,
    createCardContext
  } = useProjectList(props)

  /**
   * Render projects
   *
   * @param projects - Projects to render
   */
  function renderProjects(projects: ProjectListModel[]) {
    switch (state.renderMode) {
      case 'tiles': {
        props.columns.map((col) => {
          col.isSorted = col.key === state.sort?.fieldName
          if (col.isSorted) {
            col.isSortedDescending = state.sort?.isSortedDescending
          }
          return col
        })

        return projects.map((project, idx) => (
          <ProjectCardContext.Provider key={idx} value={createCardContext(project)}>
            <ProjectCard />
          </ProjectCardContext.Provider>
        ))
      }
      case 'list':
      case 'compactList': {
        const size = state.renderMode === 'list' ? 'medium' : 'extra-small'

        const columns = props.columns.map((col) => {
          col.isSorted = col.key === state.sort?.fieldName
          if (col.isSorted) {
            col.isSortedDescending = state.sort?.isSortedDescending
          }
          return col
        })
        return (
          <ListContext.Provider
            value={{
              ...props,
              projects,
              columns,
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
      <FluentProvider theme={webLightTheme}>
        <section className={styles.root}>
          <Alert intent='info'>{strings.NoProjectsFoundMessage}</Alert>
        </section>
      </FluentProvider>
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
    <FluentProvider className={styles.root} theme={webLightTheme}>
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
        <div hidden={!props.showRenderModeSelector}>
          <RenderModeDropdown
            renderAs={state.renderMode}
            onOptionSelect={(renderAs) => setState({ renderMode: renderAs })}
          />
        </div>
        <div hidden={!props.showSortBy || state.renderMode !== 'tiles'}>
          <Tooltip
            content={format(strings.SortCardsByLabel, props.sortBy)}
            relationship='description'
            withArrow
          >
            <Button
              className={styles.sortBy}
              appearance='transparent'
              onClick={() =>
                onListSort(
                  null,
                  props.columns.find((c) => c.fieldName === 'title')
                )
              }
              size='large'
              icon={
                state.sort?.isSortedDescending ? (
                  <TextSortAscendingRegular />
                ) : (
                  <TextSortDescendingRegular />
                )
              }
            />
          </Tooltip>
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
        title={state.showProjectInfo?.title}
        page='Portfolio'
        hidden={!state.showProjectInfo}
        hideAllActions={true}
      />
    </FluentProvider>
  )
}

ProjectList.defaultProps = {
  columns: PROJECTLIST_COLUMNS,
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
  ]
}

export * from './types'
