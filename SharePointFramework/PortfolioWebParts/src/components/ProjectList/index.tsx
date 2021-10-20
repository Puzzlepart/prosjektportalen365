import { Web } from '@pnp/sp'
import { ProjectListModel } from 'models'
import MSGraph from 'msgraph-helper'
import { Pivot, PivotItem } from 'office-ui-fabric-react'
import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationModal } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { getObjectValue, sortAlphabetically } from 'pp365-shared/lib/helpers'
import React, { FunctionComponent, useEffect, useState } from 'react'
import _ from 'underscore'
import { ProjectCard } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { IProjectListProps, IProjectListState } from './types'

export const ProjectList: FunctionComponent<IProjectListProps> = (props) => {
  const [state, setState] = useState<IProjectListState>({
    loading: true,
    searchTerm: '',
    showAsTiles: props.showAsTiles,
    selectedView: 'my_projects'
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
      return (
        <DetailsList
          items={filterProjets(state.listView.projects)}
          columns={state.listView.columns}
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
    const { listView } = { ...state } as IProjectListState
    let isSortedDescending = column.isSortedDescending
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending
    }
    listView.projects = listView.projects
      .concat([])
      .sort((a, b) =>
        sortAlphabetically<ProjectListModel>(a, b, isSortedDescending, column.fieldName)
      )
    listView.columns = listView.columns.map((col) => {
      col.isSorted = col.key === column.key
      if (col.isSorted) {
        col.isSortedDescending = isSortedDescending
      }
      return col
    })
    setState({ ...state, listView })
  }

  /**
   * Render <ProjectInformationModal />
   */
  function renderProjectInformation() {
    if (state.showProjectInfo) {
      return (
        <ProjectInformationModal
          modalProps={{ isOpen: true, onDismiss: () => setState({ ...state, showProjectInfo: null }) }}
          title={state.showProjectInfo.title}
          webUrl={props.pageContext.site.absoluteUrl}
          hubSite={{
            web: new Web(props.pageContext.site.absoluteUrl),
            url: props.pageContext.site.absoluteUrl
          }}
          siteId={state.showProjectInfo.siteId}
          hideActions={true}
          page='Portfolio'
        />
      )
    }
    return null
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
   * Get project logos (group photos)
   *
   * @param batchSize - Batch size (defaults to 20)
   */
  async function getProjectLogos(batchSize: number = 20) {
    const requests = state.projects.map((p) => ({
      id: p.groupId,
      method: 'GET',
      url: `groups/${p.groupId}/photo/$value`
    }))
    while (requests.length > 0) {
      const { responses } = await MSGraph.Batch(requests.splice(0, batchSize))
      setState((prevState: IProjectListState) => {
        const projects = prevState.projects.map((p) => {
          const response = _.find(responses, (r) => r.id === p.groupId && r.status === 200)
          if (response) {
            p.logo = `data:image/png;base64, ${response.body}`
          }
          return p
        })
        return { ...state, projects }
      })
    }
  }

  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEncrichedProjects(),
      props.dataAdapter.isUserInGroup(strings.PortfolioManagerGroupName)
    ])
      .then(([projects, isUserInPortfolioManagerGroup]) => {
        const columns = props.columns.map((col) => {
          if (col.fieldName === props.sortBy) {
            col.isSorted = true
            col.isSortedDescending = true
          }
          return col
        })
        setState({
          ...state,
          projects,
          listView: { projects, columns },
          loading: false,
          isUserInPortfolioManagerGroup
        })
        if (props.showProjectLogo) {
          getProjectLogos(20)
        }
      })
  }, [])




  if (state.loading) {
    return (
      <div className={styles.root}>
        <Spinner label={props.loadingText} size={SpinnerSize.large} />
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

  const projects = filterProjets(state.projects)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.searchBox} hidden={!props.showSearchBox}>
          <SearchBox
            placeholder={props.searchBoxPlaceholderText}
            onChanged={onSearch.bind(this)}
          />
        </div>
        {state.isUserInPortfolioManagerGroup && (
          <div className={styles.projectDisplaySelect}>
            <Pivot
              onLinkClick={({ props }) => setState({ ...state, selectedView: props.itemKey })}
              selectedKey={state.selectedView}>
              <PivotItem headerText={strings.MyProjectsLabel} itemKey='my_projects' />
              <PivotItem headerText={strings.AllProjectsLabel} itemKey='all_projects' />
            </Pivot>
          </div>
        )}
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
      {renderProjectInformation()}
    </div>
  )
}

ProjectList.defaultProps = {
  columns: PROJECTLIST_COLUMNS,
  sortBy: 'Title'
}

export * from './types'
