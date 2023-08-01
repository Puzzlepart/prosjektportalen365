import {
  IColumn,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  SearchBox,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { getObjectValue } from 'pp365-shared-library/lib/util/getObjectValue'
import React, { FC } from 'react'
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
      <div className={styles.root}>
        <MessageBar messageBarType={MessageBarType.info}>{strings.NoProjectsFound}</MessageBar>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className={styles.root}>
        <MessageBar messageBarType={MessageBarType.error}>{strings.ErrorText}</MessageBar>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.projectDisplaySelect}>
          <Pivot
            onLinkClick={({ props }) =>
              setState({ selectedVertical: find(verticals, (v) => v.itemKey === props.itemKey) })
            }
            selectedKey={state.selectedVertical.itemKey}
          >
            {state.isDataLoaded &&
              verticals
                .filter((vertical) => !vertical.isHidden || !vertical.isHidden(state))
                .map((vertical) => (
                  <PivotItem
                    key={vertical.itemKey}
                    itemKey={vertical.itemKey}
                    headerText={vertical.headerText}
                    itemIcon={vertical.itemIcon}
                    headerButtonProps={
                      vertical.getHeaderButtonProps && vertical.getHeaderButtonProps(state)
                    }
                  >
                    <div className={styles.searchBox} hidden={!props.showSearchBox}>
                      <SearchBox
                        disabled={!state.isDataLoaded || isEmpty(state.projects)}
                        value={state.searchTerm}
                        placeholder={searchBoxPlaceholder}
                        onChange={onSearch}
                      />
                    </div>
                    <RenderModeDropdown
                      hidden={!props.showRenderModeSelector}
                      renderAs={state.renderMode}
                      onChange={(renderAs) => setState({ renderMode: renderAs })}
                    />
                    {state.isDataLoaded && isEmpty(projects) && (
                      <div className={styles.emptyMessage}>
                        <MessageBar>{strings.ProjectListEmptyText}</MessageBar>
                      </div>
                    )}
                    <div className={styles.projects}>{renderProjects(projects)}</div>
                  </PivotItem>
                ))}
          </Pivot>
        </div>
      </div>
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
    </div>
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
