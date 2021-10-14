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
import React, { Component } from 'react'
import * as _ from 'underscore'
import { ProjectCard } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { IProjectListProps, IProjectListState, placeholderImage } from './types'

/**
 * @component ProjectList
 * @extends Component
 */
export class ProjectList extends Component<IProjectListProps, IProjectListState> {
  public static defaultProps: Partial<IProjectListProps> = {
    columns: PROJECTLIST_COLUMNS,
    sortBy: 'Title'
  }

  /**
   * Constructor
   *
   * @param props - Props
   */
  constructor(props: IProjectListProps) {
    super(props)
    this.state = {
      loading: true,
      searchTerm: '',
      showAsTiles: props.showAsTiles,
      selectedView: 'my_projects'
    }
  }

  public async componentDidMount() {
    try {
      // eslint-disable-next-line prefer-const
      let [projects, isUserInPortfolioManagerGroup] = await Promise.all([
        this.props.dataAdapter.fetchEncrichedProjects(),
        this.props.dataAdapter.isUserInGroup(
          strings.PortfolioManagerGroupName
        )
      ])
      const columns = this.props.columns.map((col) => {
        if (col.fieldName === this.props.sortBy) {
          col.isSorted = true
          col.isSortedDescending = true
        }
        return col
      })
      this.setState({
        projects,
        listView: { projects, columns },
        loading: false,
        isUserInPortfolioManagerGroup
      })
      if (this.props.showProjectLogo) {
        this._getProjectLogos(20)
      }
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  /**
   * Renders the <ProjectList /> component
   */
  public render(): React.ReactElement<IProjectListProps> {
    if (this.state.loading) {
      return (
        <div className={styles.root}>
          <Spinner label={this.props.loadingText} size={SpinnerSize.large} />
        </div>
      )
    }
    if (this.state.error) {
      return (
        <div className={styles.root}>
          <MessageBar messageBarType={MessageBarType.error}>{strings.ErrorText}</MessageBar>
        </div>
      )
    }
    const projects = this._filterProjets(this.state.projects)
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <div
            className={
              this.state.isUserInPortfolioManagerGroup ? styles.shrinkedSearchBox : styles.searchBox
            }
            hidden={!this.props.showSearchBox}>
            <SearchBox
              placeholder={this.props.searchBoxPlaceholderText}
              onChanged={this._onSearch.bind(this)}
            />
          </div>
          {this.state.isUserInPortfolioManagerGroup && (
            <div className={styles.projectDisplaySelect}>
              <Pivot
                onLinkClick={({ props }) => this.setState({ selectedView: props.itemKey })}
                selectedKey={this.state.selectedView}>
                <PivotItem headerText={strings.MyProjectsLabel} itemKey='my_projects' />
                <PivotItem headerText={strings.AllProjectsLabel} itemKey='all_projects' />
              </Pivot>
            </div>
          )}
          <div
            className={
              this.state.isUserInPortfolioManagerGroup
                ? styles.shrinkedViewToggle
                : styles.viewToggle
            }
            hidden={!this.props.showViewSelector}>
            <Toggle
              offText={strings.ShowAsListText}
              onText={strings.ShowAsTilesText}
              defaultChecked={this.state.showAsTiles}
              inlineLabel={true}
              onChanged={(showAsTiles) => this.setState({ showAsTiles })}
            />
          </div>
          <div className={styles.emptyMessage} hidden={projects.length > 0}>
            <MessageBar>{strings.NoSearchResults}</MessageBar>
          </div>
          <div className={styles.projects} hidden={projects.length === 0}>
            {this._renderProjects(projects)}
          </div>
        </div>
        {this._renderProjectInformation()}
      </div>
    )
  }

  /**
   * Render projects
   *
   * @param projects - Projects
   */
  private _renderProjects(projects: ProjectListModel[]) {
    if (this.state.showAsTiles) {
      return projects.map((project, idx) => (
        <ProjectCard
          key={idx}
          project={project}
          shouldTruncateTitle={true}
          showProjectLogo={this.props.showProjectLogo}
          showProjectOwner={this.props.showProjectOwner}
          showProjectManager={this.props.showProjectManager}
          actions={this._getCardActions(project)}
        />
      ))
    } else {
      return (
        <DetailsList
          items={projects}
          columns={this.state.listView.columns}
          onRenderItemColumn={this._onRenderItemColumn.bind(this)}
          onColumnHeaderClick={this._onListSort.bind(this)}
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
  private _onRenderItemColumn(project: ProjectListModel, _index: number, column: IColumn) {
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
  private _onListSort(_evt: React.MouseEvent<any>, column: IColumn): void {
    const { listView } = { ...this.state } as IProjectListState
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
    this.setState({ listView })
  }

  /**
   * Render <ProjectInformationModal />
   */
  private _renderProjectInformation() {
    if (this.state.showProjectInfo) {
      return (
        <ProjectInformationModal
          modalProps={{ isOpen: true, onDismiss: () => this.setState({ showProjectInfo: null }) }}
          title={this.state.showProjectInfo.title}
          webUrl={this.props.pageContext.site.absoluteUrl}
          hubSite={{
            web: new Web(this.props.pageContext.site.absoluteUrl),
            url: this.props.pageContext.site.absoluteUrl
          }}
          siteId={this.state.showProjectInfo.siteId}
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
  private _getCardActions(project: ProjectListModel): IButtonProps[] {
    return [
      {
        id: 'ON_SELECT_PROJECT',
        iconProps: { iconName: 'OpenInNewWindow' },
        onClick: (event: React.MouseEvent<any>) => this._onExecuteCardAction(event, project)
      }
    ]
  }

  /**
   * On execute card action
   *
   * @param event - Event
   * @param project - Project
   */
  private _onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    switch (event.currentTarget.id) {
      case 'ON_SELECT_PROJECT':
        {
          this.setState({ showProjectInfo: project })
        }
        break
    }
  }

  /**
   * Filter projects
   *
   * @param projects - Projects
   */
  private _filterProjets(projects: ProjectListModel[]) {
    return projects
      .filter((project) => {
        if (this.state.selectedView === 'my_projects') return project.userIsMember
        return true
      })
      .filter((p) => {
        const matches = Object.keys(p).filter((key) => {
          const value = p[key]
          return (
            value &&
            typeof value === 'string' &&
            value.toLowerCase().indexOf(this.state.searchTerm) !== -1
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
  private _onSearch(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.toLowerCase() })
  }

  /**
   * Get project logos (group photos)
   *
   * @param batchSize - Batch size (defaults to 20)
   */
  private async _getProjectLogos(batchSize: number = 20) {
    const requests = this.state.projects.map((p) => ({
      id: p.groupId,
      method: 'GET',
      url: `groups/${p.groupId}/photo/$value`
    }))
    while (requests.length > 0) {
      const { responses } = await MSGraph.Batch(requests.splice(0, batchSize))
      this.setState((prevState: IProjectListState) => {
        const projects = prevState.projects.map((p) => {
          const response = _.find(responses, (r) => r.id === p.groupId && r.status === 200)
          if (response) {
            p.logo = `data:image/png;base64, ${response.body}`
          } else {
            p.logo = placeholderImage
          }
          return p
        })
        return { projects }
      })
    }
  }
}

export { IProjectListProps }
