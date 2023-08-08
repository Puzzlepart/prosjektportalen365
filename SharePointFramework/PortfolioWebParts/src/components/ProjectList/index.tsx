import React, { FC } from 'react'
import { IColumn, SelectionMode, ShimmeredDetailsList } from '@fluentui/react'
import {
  FluentProvider,
  SelectTabData,
  Tab,
  TabList,
  webLightTheme
} from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { SearchBox } from '@fluentui/react-search-preview'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { getObjectValue } from 'pp365-shared-library/lib/util/getObjectValue'
import { find, isEmpty } from 'underscore'
import { ProjectCard } from './ProjectCard'
import { ProjectCardContext } from './ProjectCard/context'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { ProjectListVerticals } from './ProjectListVerticals'
import { RenderModeDropdown } from './RenderModeDropdown'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { ProjectListModel } from 'pp365-shared-library/lib/models'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const {
    state,
    setState,
    projects,
    verticals,
    getCardActions,
    onListSort,
    onSearch,
    searchBoxPlaceholder
  } = useProjectList(props)

  /**
   * Render projects
   *
   * @param projects - Projects to render
   */
  function renderProjects(projects: ProjectListModel[]) {
    switch (state.renderMode) {
      case 'tiles': {
        return projects.map((project, idx) => (
          <ProjectCardContext.Provider
            key={idx}
            value={{
              ...props,
              project,
              actions: getCardActions(project),
              isDataLoaded: state.isDataLoaded
            }}
          >
            <ProjectCard />
          </ProjectCardContext.Provider>
        ))
      }
      case 'list': {
        const columns = props.columns.map((col) => {
          col.isSorted = col.key === state.sort?.fieldName
          if (col.isSorted) {
            col.isSortedDescending = state.sort?.isSortedDescending
          }
          return col
        })
        return (
          <ShimmeredDetailsList
            enableShimmer={!state.isDataLoaded}
            items={projects}
            columns={columns}
            onRenderItemColumn={onRenderItemColumn}
            onColumnHeaderClick={onListSort}
            selectionMode={SelectionMode.none}
          />
        )
      }
    }
  }

  /**
   * On render item column
   *
   * @param project - Project
   * @param _index - Index
   * @param column - Column
   */
  function onRenderItemColumn(project: ProjectListModel, _index: number, column: IColumn) {
    const colValue = getObjectValue(project, column.fieldName, null)
    if (column.fieldName === 'title') {
      if (project.isUserMember) return <a href={project.url}>{colValue}</a>
      return <>{colValue}</>
    }
    return colValue
  }

  if (state.projects.length === 0) {
    return (
      <FluentProvider theme={webLightTheme}>
        <section className={styles.projectList}>
          <Alert intent={'info'}>{strings.NoProjectsFound}</Alert>
        </section>
      </FluentProvider>
    )
  }

  if (state.error) {
    return (
      <FluentProvider theme={webLightTheme}>
        <section className={styles.projectList}>
          <Alert intent={'error'}>{strings.ErrorText}</Alert>
        </section>
      </FluentProvider>
    )
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <section className={styles.projectList}>
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
          <SearchBox
            className={styles.searchBox}
            disabled={!state.isDataLoaded || isEmpty(state.projects)}
            value={state.searchTerm}
            placeholder={searchBoxPlaceholder}
            aria-label={searchBoxPlaceholder}
            size={'large'}
            onChange={onSearch}
            appearance={'filled-lighter'}
            hidden={!props.showSearchBox}
          />
          <RenderModeDropdown
            hidden={!props.showRenderModeSelector}
            renderAs={state.renderMode}
            onOptionSelect={(renderAs) => setState({ renderMode: renderAs })}
          />
        </div>
        {state.isDataLoaded && isEmpty(projects) && (
          <div className={styles.emptyMessage}>
            <Alert intent={'info'}>{strings.ProjectListEmptyText}</Alert>
          </div>
        )}
        <div className={styles.projects}>{renderProjects(projects)}</div>
      </section>
      <ProjectInformationPanel
        key={state.showProjectInfo?.siteId}
        title={state.showProjectInfo?.title}
        siteId={state.showProjectInfo?.siteId}
        webUrl={state.showProjectInfo?.url}
        webPartContext={props.webPartContext}
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
  defaultRenderMode: 'tiles',
  defaultVertical: 'my_projects',
  verticals: ProjectListVerticals,
  hideVerticals: []
}

export * from './types'
