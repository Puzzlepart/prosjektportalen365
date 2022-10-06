import { ProjectListModel } from 'models'
import { Pivot, PivotItem, ShimmeredDetailsList } from 'office-ui-fabric-react'
import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue, sortAlphabetically } from 'pp365-shared/lib/helpers'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { ProjectCard } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { IProjectListProps, IProjectListState } from './types'

export const ProjectList: FunctionComponent<IProjectListProps> = (props) => {
  const [state, setState] = useState<IProjectListState>({
    loading: true,
    searchTerm: '',
    showAsTiles: props.showAsTiles,
    selectedView: 'my_projects',
    projects: [],
    sort: { fieldName: props.sortBy, isSortedDescending: true }
  })

  /**
   * Render projects
   *
   * @param projects - Projects
   */
  function renderProjects(projects: ProjectListModel[]) {
    if (state.showAsTiles) {
      return projects.map((project, idx) => (
        <ProjectCard
          key={idx}
          project={project}
          shouldTruncateTitle={true}
          showProjectLogo={props.showProjectLogo}
          showProjectOwner={props.showProjectOwner}
          showProjectManager={props.showProjectManager}
          actions={getCardActions(project)}
        />
      ))
    } else {
      const columns = props.columns.map((col) => {
        col.isSorted = col.key === state.sort?.fieldName
        if (col.isSorted) {
          col.isSortedDescending = state.sort?.isSortedDescending
        }
        return col
      })
      return (
        <ShimmeredDetailsList
          enableShimmer={state.loading}
          items={projects}
          columns={columns}
          onRenderItemColumn={onRenderItemColumn}
          onColumnHeaderClick={onListSort}
          selectionMode={SelectionMode.none}
        />
      )
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
      if (project.userIsMember) return <a href={project.url}>{colValue}</a>
      return <>{colValue}</>
    }
    return colValue
  }

  /**
   * Sorting on column header click
   *
   * @param _evt - Event
   * @param column - Column
   */
  function onListSort(_evt: React.MouseEvent<any>, column: IColumn): void {
    let isSortedDescending = column.isSortedDescending
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending
    }
    setState({ ...state, sort: { fieldName: column.fieldName, isSortedDescending } })
  }

  /**
   * Get card ations
   *
   * @param project - Project
   */
  function getCardActions(project: ProjectListModel): IButtonProps[] {
    return [
      {
        id: 'ON_SELECT_PROJECT',
        iconProps: { iconName: 'OpenInNewWindow' },
        onClick: (event: React.MouseEvent<any>) => onExecuteCardAction(event, project)
      }
    ]
  }

  /**
   * On execute card action
   *
   * @param event - Event
   * @param project - Project
   */
  function onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    switch (event.currentTarget.id) {
      case 'ON_SELECT_PROJECT':
        {
          setState({ ...state, showProjectInfo: project })
        }
        break
    }
  }

  /**
   * Filter projects
   *
   * @param projects - Projects
   */
  function filterProjets(projects: ProjectListModel[]) {
    return projects
      .filter((project) => {
        if (state.selectedView === 'my_projects') return project.userIsMember
        if (state.selectedView === 'parent_projects') return project.isParent
        if (state.selectedView === 'program') return project.isProgram
        return true
      })
      .filter((p) => {
        const matches = Object.keys(p).filter((key) => {
          const value = p[key]
          return (
            value &&
            typeof value === 'string' &&
            value.toLowerCase().indexOf(state.searchTerm) !== -1
          )
        }).length
        return matches > 0
      })
      .sort((a, b) =>
        sortAlphabetically<ProjectListModel>(
          a,
          b,
          state?.sort?.isSortedDescending,
          state?.sort?.fieldName
        )
      )
  }

  /**
   * On search
   *
   * @param searchTerm - Search term
   */
  function onSearch(searchTerm: string) {
    setState({ ...state, searchTerm: searchTerm.toLowerCase() })
  }

  /**
   * Get searchbox placeholder text based on `state.selectedView`
   */
  function getSearchBoxPlaceholder() {
    switch (state.selectedView) {
      case 'my_projects':
        return strings.MyProjectsSearchBoxPlaceholderText
      case 'all_projects':
        return strings.AllProjectsSearchBoxPlaceholderText
      case 'parent_projects':
        return strings.ParentProjectsSearchBoxPlaceholderText
      case 'program':
        return strings.ProgramSearchBoxPlaceholderText
    }
  }

  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEnrichedProjects(),
      props.dataAdapter.isUserInGroup(strings.PortfolioManagerGroupName)
    ]).then(([projects, isUserInPortfolioManagerGroup]) => {
      setState({
        ...state,
        projects,
        loading: false,
        isUserInPortfolioManagerGroup
      })
    })
  }, [])

  if (state.error) {
    return (
      <div className={styles.root}>
        <MessageBar messageBarType={MessageBarType.error}>{strings.ErrorText}</MessageBar>
      </div>
    )
  }

  const projects = filterProjets(state.projects)

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {state.isUserInPortfolioManagerGroup && (
          <div className={styles.projectDisplaySelect}>
            <Pivot
              onLinkClick={({ props }) => setState({ ...state, selectedView: props.itemKey })}
              selectedKey={state.selectedView}>
              <PivotItem headerText={strings.MyProjectsLabel} itemKey='my_projects' />
              <PivotItem headerText={strings.AllProjectsLabel} itemKey='all_projects' />
              <PivotItem headerText={strings.ParentProjectLabel} itemKey='parent_projects' />
              <PivotItem headerText={strings.ProgramLabel} itemKey='program' />
            </Pivot>
          </div>
        )}
        <div className={styles.searchBox} hidden={!props.showSearchBox}>
          <SearchBox placeholder={getSearchBoxPlaceholder()} onChanged={onSearch} />
        </div>
        <div className={styles.viewToggle} hidden={!props.showViewSelector}>
          <Toggle
            offText={strings.ShowAsListText}
            onText={strings.ShowAsTilesText}
            defaultChecked={state.showAsTiles}
            inlineLabel={true}
            onChanged={(showAsTiles) => setState({ ...state, showAsTiles })}
          />
        </div>
        <div className={styles.emptyMessage} hidden={projects.length > 0}>
          <MessageBar>{strings.NoSearchResults}</MessageBar>
        </div>
        <div className={styles.projects} hidden={projects.length === 0}>
          {renderProjects(projects)}
        </div>
      </div>
      {/* {renderProjectInformation()} */}
    </div>
  )
}

ProjectList.defaultProps = {
  columns: PROJECTLIST_COLUMNS,
  sortBy: 'Title'
}

export * from './types'
