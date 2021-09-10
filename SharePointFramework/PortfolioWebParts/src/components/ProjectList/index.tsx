import { Web } from '@pnp/sp'
import { ProjectListModel } from 'models'
import MSGraph from 'msgraph-helper'
import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationModal } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { getObjectValue, sortAlphabetically } from 'pp365-shared/lib/helpers'
import React, { Component } from 'react'
import * as _ from 'underscore'
import { ProjectCard } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { IProjectListProps, IProjectListState } from './types'
import { Pivot, PivotItem } from 'office-ui-fabric-react'
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
   * @param {IProjectListProps} props Props
   */
  constructor(props: IProjectListProps) {
    super(props)
    this.state = {
      loading: true,
      searchTerm: '',
      showAsTiles: props.showAsTiles,
      onlyAccessProjects: true
    }
  }

  public async componentDidMount() {
    try {
      let projects = await this.props.dataAdapter.fetchEncrichedProjects()
      const inReadOnlyGroup = await this.props.dataAdapter.isUserInGroup(
        strings.PortfolioManagerGroupName
      )

      if (!this.state.onlyAccessProjects)
        projects = projects.filter((project) => project.readOnly === false)

      projects = projects.sort((a, b) => sortAlphabetically(a, b, true, this.props.sortBy))
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
        isUserInPortfolioManagerGroup: inReadOnlyGroup
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
          <Spinner label={this.props.loadingText} type={SpinnerType.large} />
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
            className={this.state.isUserInPortfolioManagerGroup ? styles.shrinkedSearchBox : styles.searchBox}
            hidden={!this.props.showSearchBox}>
            <SearchBox
              placeholder={this.props.searchBoxPlaceholderText}
              onChanged={this._onSearch.bind(this)}
            />
          </div>
          {this.state.isUserInPortfolioManagerGroup && (
            <div className={styles.projectDisplaySelect}>
              <Pivot
                onLinkClick={(item) =>
                  item.props.itemKey === 'myProjects'
                    ? this.setState({ onlyAccessProjects: true })
                    : this.setState({ onlyAccessProjects: false })
                }
                selectedKey={this.state.onlyAccessProjects ? 'myProjects' : 'allProjects'}>
                <PivotItem headerText={strings.MyProjectsLabel} itemKey='myProjects' />
                <PivotItem headerText={strings.AllProjectsLabel} itemKey='allProjects' />
              </Pivot>
            </div>
          )}
          <div
            className={this.state.isUserInPortfolioManagerGroup ? styles.shrinkedViewToggle : styles.viewToggle}
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
   * @param {ProjectListModel[]} projects Projects
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
          items={this._filterProjets(this.state.listView.projects)}
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
   * @param {ProjectListModel} project Project
   * @param {number} _index Index
   * @param {IColumn} column Column
   */
  private _onRenderItemColumn(project: ProjectListModel, _index: number, column: IColumn) {
    const colValue = getObjectValue(project, column.fieldName, null)
    if (column.fieldName === 'title' && !project.readOnly) {
      return <a href={project.url}>{colValue}</a>
    } else if (column.fieldName === 'title' && project.readOnly && this.state.onlyAccessProjects) {
      return <>{colValue}</>
    }
    return colValue
  }

  /**
   * Sorting on column header click
   *
   * @param {React.MouseEvent} _evt Event
   * @param {IColumn} column Column
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
   * @param {ProjectListModel} project Project
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
   * @param {React.MouseEvent} event Event
   * @param {ProjectListModel} project Project
   */
  private _onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    // eslint-disable-next-line default-case
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
   * @param {ProjectListModel[]} projects Projects
   */
  private _filterProjets(projects: ProjectListModel[]) {
    if (this.state.onlyAccessProjects) {
      projects = projects.filter((project) => !project.readOnly)
    }

    return projects.filter((p) => {
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
   * @param {string} searchTerm Search term
   */
  private _onSearch(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.toLowerCase() })
  }

  /**
   * Get project logos (group photos)
   *
   * @param {number} batchSize Batch size (defaults to 20)
   */
  private async _getProjectLogos(batchSize = 20) {
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
            p.logo = "data:image/jpeg;base64,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CiiigAooooAKKKKAHx/fX60UR/fX60V1UPgf+J/kjmr7x9H+Z6B8XP8AkqnxI/7HnxV/6e72vPK9D+Ln/JVPiR/2PPir/wBPd7XnleNlX/Iry3/sAwf/AKj0z3M6/wCRzm3/AGM8f/6lVQooorvPMCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAfH99frRRH99frRXVQ+B/4n+SOavvH0f5noHxc/5Kp8SP+x58Vf8Ap7va88r0P4uf8lU+JH/Y8+Kv/T3e155XjZV/yK8t/wCwDB/+o9M9zOv+Rzm3/Yzx/wD6lVQooorvPMCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAfH99frRRH99frRXVQ+B/wCJ/kjmr7x9H+Z6B8XP+SqfEj/sefFX/p7va88r0P4uf8lU+JH/AGPPir/093teeV42Vf8AIry3/sAwf/qPTPczr/kc5t/2M8f/AOpVUKKKK7zzAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAHx/fX60UR/fX60V1UPgf+J/kjmr7x9H+Z6B8XP+SqfEj/ALHnxV/6e72vPK9D+Ln/ACVT4kf9jz4q/wDT3e155XjZV/yK8t/7AMH/AOo9M9zOv+Rzm3/Yzx//AKlVQooorvPMCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAfH99frRRH99frRXVQ+B/4n+SOavvH0f5noHxc/wCSqfEj/sefFX/p7va88r0P4uf8lU+JH/Y8+Kv/AE93teeV42Vf8ivLf+wDB/8AqPTPczr/AJHObf8AYzx//qVVCiiiu88wKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigB8f31+tFEf31+tFdVD4H/if5I5q+8fR/megfFz/kqnxI/7HnxV/wCnu9rzyvQ/i5/yVT4kf9jz4q/9Pd7XnleNlX/Iry3/ALAMH/6j0z3M6/5HObf9jPH/APqVVCiiiu88wKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigB8f31+tFEf31+tFdVD4H/AIn+SOavvH0f5noHxc/5Kp8SP+x58Vf+nu9rzyvQ/i5/yVT4kf8AY8+Kv/T3e155XjZV/wAivLf+wDB/+o9M9zOv+Rzm3/Yzx/8A6lVQooorvPMCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAfH99frRRH99frRXVQ+B/4n+SOavvH0f5noHxc/5Kp8SP8AsefFX/p7va88r0P4uf8AJVPiR/2PPir/ANPd7XnleNlX/Iry3/sAwf8A6j0z3M6/5HObf9jPH/8AqVVCiiiu88wKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigB8f31+tFEf31+tFdVD4H/if5I5q+8fR/megfFz/AJKp8SP+x58Vf+nu9rzyvQ/i5/yVT4kf9jz4q/8AT3e155XjZV/yK8t/7AMH/wCo9M9zOv8Akc5t/wBjPH/+pVUKKKK7zzAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAHx/fX60UR/fX60V1UPgf+J/kjmr7x9H+Z6B8XP+SqfEj/sefFX/AKe72vPK9D+Ln/JVPiR/2PPir/093teeV42Vf8ivLf8AsAwf/qPTPczr/kc5t/2M8f8A+pVUKKKK7zzAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAHx/fX60UR/fX60V1UPgf8Aif5I5q+8fR/megfFz/kqnxI/7HnxV/6e72vPK9D+Ln/JVPiR/wBjz4q/9Pd7XnleNlX/ACK8t/7AMH/6j0z3M6/5HObf9jPH/wDqVVCiiiu88wKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigB8f31+tFEf31+tFdVD4H/if5I5q+8fR/megfFz/kqnxI/wCx58Vf+nu9rzyvQ/i5/wAlU+JH/Y8+Kv8A093teeV42Vf8ivLf+wDB/wDqPTPczr/kc5t/2M8f/wCpVUKKKK7zzAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAHx/fX60UR/fX60V1UPgf+J/kjmr7x9H+Z6B8XP8AkqnxI/7HnxV/6e72vPK9D+Ln/JVPiR/2PPir/wBPd7XnleNlX/Iry3/sAwf/AKj0z3M6/wCRzm3/AGM8f/6lVQooorvPMCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAfH99frRRH99frRXVQ+B/4n+SOavvH0f5noHxc/5Kp8SP+x58Vf8Ap7va88r0P4uf8lU+JH/Y8+Kv/T3e155XjZV/yK8t/wCwDB/+o9M9zOv+Rzm3/Yzx/wD6lVQooorvPMCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAfH99frRRH99frRXVQ+B/wCJ/kjmr7x9H+Z6F8WkZvil8RmUEhvHHikgjoQdavSCPqK898t/7poorzsrpR/szLleX+44Pt/0D0fLzZ62eVJLOs3VlpmmPWz/AOgufn5sPLf+6aPLf+6aKK7/AGUdNZdO3Xl8v7zPL9rLTRdOj68vn/eYeW/900eW/wDdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f95h5b/wB00eW/900UUeyjprLp268vl/eYe1lpounR9eXz/vMPLf8Aumjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f8AeYeW/wDdNHlv/dNFFHso6ay6duvL5f3mHtZaaLp0fXl8/wC8w8t/7po8t/7pooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/8AdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/ALpooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/wDdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f95h5b/wB00eW/900UUeyjprLp268vl/eYe1lpounR9eXz/vMPLf8Aumjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f8AeYeW/wDdNHlv/dNFFHso6ay6duvL5f3mHtZaaLp0fXl8/wC8w8t/7po8t/7pooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/8AdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/ALpooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/wDdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f95h5b/wB00eW/900UUeyjprLp268vl/eYe1lpounR9eXz/vMPLf8Aumjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f8AeYeW/wDdNHlv/dNFFHso6ay6duvL5f3mHtZaaLp0fXl8/wC8w8t/7po8t/7pooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/8AdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/ALpooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/wDdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f95h5b/wB00eW/900UUeyjprLp268vl/eYe1lpounR9eXz/vMPLf8Aumjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f8AeYeW/wDdNHlv/dNFFHso6ay6duvL5f3mHtZaaLp0fXl8/wC8w8t/7po8t/7pooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/8AdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/ALpooo9lHTWXTt15fL+8w9rLTRdOj68vn/eYeW/900eW/wDdNFFHso6ay6duvL5f3mHtZaaLp0fXl8/7zDy3/umjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f95h5b/wB00eW/900UUeyjprLp268vl/eYe1lpounR9eXz/vMPLf8Aumjy3/umiij2UdNZdO3Xl8v7zD2stNF06Pry+f8AeYeW/wDdNHlv/dNFFHso6ay6duvL5f3mHtZaaLp0fXl8/wC8w8t/7po8t/7pooo9lHTWXTt15fL+8w9rLTRdOj68vn/eY+ON96/KetFFFdNClHlau9126qHl5nLWqy5oq0fhXR9WvPzP/9k="
          }
          return p
        }
        )
        return { projects }
      })
    }
  }
}

export { IProjectListProps }
