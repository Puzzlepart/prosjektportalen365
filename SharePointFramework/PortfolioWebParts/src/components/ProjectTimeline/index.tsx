import { get } from '@microsoft/sp-lodash-subset'
import { getId } from '@uifabric/utilities'
import sortArray from 'array-sort'
import { ITimelineData, ITimelineGroup, ITimelineItem } from 'interfaces'
import moment from 'moment'
import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'PortfolioWebPartsStrings'
import React, { Component } from 'react'
import _ from 'underscore'
import { FilterPanel, IFilterItemProps, IFilterProps } from '../FilterPanel'
import { DetailsCallout } from './DetailsCallout'
import { Timeline } from './Timeline'
import styles from './ProjectTimeline.module.scss'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import { ProjectListModel, TimelineContentListModel } from 'models'
import './ProjectTimeline.overrides.css'

/**
 * @component ProjectTimeline
 * @extends Component
 */
export class ProjectTimeline extends Component<IProjectTimelineProps, IProjectTimelineState> {
  /**
   * Constructor
   *
   * @param props Props
   */
  constructor(props: IProjectTimelineProps) {
    super(props)
    this.state = { loading: true, showFilterPanel: false, activeFilters: {} }
    moment.locale('nb')
  }

  public async componentDidMount(): Promise<void> {
    try {
      const data = await this._fetchData()
      this.setState({ data, loading: false })
    } catch (error) {
      this.setState({ error: error.message || error.status, loading: false })
    }
  }

  public render(): React.ReactElement<IProjectTimelineProps> {
    if (this.state.loading) {
      return (
        <div className={styles.root}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, this.props.title)} />
          </div>
        </div>
      )
    }
    if (this.state.error) {
      return (
        <div className={styles.root}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      )
    }

    const { groups, items } = this._getFilteredData()

    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar {...this._getCommandBarProps()} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.infoText}>
            <MessageBar>
              <div
                dangerouslySetInnerHTML={{
                  __html: format(
                    this.props.infoText ? this.props.infoText : strings.ProjectTimelineInfoText,
                    encodeURIComponent(window.location.href)
                  )
                }}></div>
            </MessageBar>
          </div>
          <Timeline
            defaultTimeStart={[-1, 'months']}
            defaultTimeEnd={[1, 'years']}
            _onItemClick={this._onItemClick.bind(this)}
            groups={groups}
            items={items}
          />
        </div>
        <FilterPanel
          isOpen={this.state.showFilterPanel}
          headerText={strings.FilterText}
          filters={this._getFilters()}
          onFilterChange={this._onFilterChange.bind(this)}
          onDismiss={() => this.setState({ showFilterPanel: false })}
        />
        {this.state.showDetails && (
          <DetailsCallout
            item={this.state.showDetails}
            onDismiss={() => this.setState({ showDetails: null })}
          />
        )}
      </div>
    )
  }

  /**
   * On item click
   *
   * @param event Event
   * @param item Item
   */
  private _onItemClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>, item: ITimelineItem) {
    this.setState({ showDetails: { element: event.currentTarget, data: item } })
  }

  /**
   * Get filtered data
   */
  private _getFilteredData(): ITimelineData {
    const { activeFilters, data } = { ...this.state } as IProjectTimelineState
    const activeFiltersKeys = Object.keys(activeFilters)
    const projectId = data.items.find(
      (i) => i?.projectUrl === this.props.pageContext.site.absoluteUrl
    )?.id
    const topGroup = data.groups.find((i) => i?.id === projectId)
    projectId &&
      (data.groups = [topGroup, ...data.groups.filter((grp) => grp?.id !== projectId)].filter(
        (grp) => grp
      ))

    if (activeFiltersKeys.length > 0) {
      const items = activeFiltersKeys.reduce(
        (newItems, key) => newItems.filter((i) => activeFilters[key].indexOf(get(i, key)) !== -1),
        data.items
      )
      const groups = data.groups.filter((grp) => items.filter((i) => i.group === grp.id).length > 0)
      return { items, groups }
    } else {
      return data
    }
  }

  /**
   * Get filters
   */
  private _getFilters(): IFilterProps[] {
    const columns = [
      { fieldName: 'project', name: strings.SiteTitleLabel },
      { fieldName: 'type', name: strings.TypeLabel }
    ]
    return columns.map((col) => ({
      column: { key: col.fieldName, minWidth: 0, ...col },
      items: this.state.data.items
        .map((i) => get(i, col.fieldName))
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .map((name) => {
          const filter = this.state.activeFilters[col.fieldName]
          const selected = filter ? filter.indexOf(name) !== -1 : false
          return { name, value: name, selected }
        })
    }))
  }

  /**
   * On filter change
   *
   * @param column Column
   * @param selectedItems Selected items
   */
  private _onFilterChange(column: IColumn, selectedItems: IFilterItemProps[]) {
    const { activeFilters } = { ...this.state } as IProjectTimelineState
    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
    } else {
      delete activeFilters[column.fieldName]
    }
    this.setState({ activeFilters })
  }

  /**
   * Get command bar items
   */
  private _getCommandBarProps(): ICommandBarProps {
    const cmd: ICommandBarProps = { items: [], farItems: [] }
    cmd.farItems.push({
      key: getId('Filter'),
      name: strings.FilterText,
      iconProps: { iconName: 'Filter' },
      itemType: ContextualMenuItemType.Header,
      buttonStyles: { root: { border: 'none', height: '40px' } },
      iconOnly: true,
      onClick: (ev) => {
        ev.preventDefault()
        this.setState({ showFilterPanel: true })
      }
    })
    return cmd
  }

  /**
   * Creating groups based on projects title
   *
   * @returns {ITimelineGroup[]} Timeline groups
   */
  private _transformGroups(projects: ProjectListModel[]): ITimelineGroup[] {
    const groupNames: string[] = projects
      .map((project) => {
        const name = project.title
        return name
      })
      .filter((value, index, self) => self.indexOf(value) === index)
    let groups: ITimelineGroup[] = groupNames.map((name, id) => {
      const [title] = name.split('|')
      return {
        id,
        title
      }
    })
    groups = sortArray(groups, ['type', 'title'])
    return groups
  }

  /**
   * Create items
   *
   * @param projects Projects
   * @param timelineItems Timeline items
   * @param groups Groups
   *
   * @returns {ITimelineItem[]} Timeline items
   */
  private _transformItems(
    projects: ProjectListModel[],
    timelineItems: TimelineContentListModel[],
    groups: ITimelineGroup[]
  ): ITimelineItem[] {
    const items: ITimelineItem[] = projects.map((project, id) => {
      const group = _.find(groups, (grp) => project.title.indexOf(grp.title) !== -1)
      const style: React.CSSProperties = {
        color: 'white',
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background: '#f35d69',
        backgroundColor: '#f35d69'
      }
      return {
        id,
        group: group.id,
        title: format(strings.ProjectTimelineItemInfo, project.title),
        start_time: moment(new Date(project.startDate)),
        end_time: moment(new Date(project.endDate)),
        itemProps: { style },
        project: project.title,
        projectUrl: project.url,
        phase: project.phase,
        type: project.type,
        budgetTotal: project.budgetTotal,
        costsTotal: project.costsTotal
      } as ITimelineItem
    })

    const phases: ITimelineItem[] = timelineItems.map((item, id) => {
      id += items.length

      const backgroundColor =
        item.type === strings.PhaseLabel
          ? '#2589d6'
          : item.type === strings.MilestoneLabel
          ? 'transparent'
          : item.type === strings.SubPhaseLabel
          ? '#249ea0'
          : '#484848'

      const group = _.find(groups, (grp) => item.title.indexOf(grp.title) !== -1)
      const style: React.CSSProperties = {
        color: 'white',
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background: backgroundColor,
        backgroundColor: backgroundColor
      }
      return {
        id,
        group: group.id,
        title: item.itemTitle,
        start_time:
          item.type === strings.MilestoneLabel
            ? moment(new Date(item.endDate))
            : moment(new Date(item.startDate)),
        end_time: moment(new Date(item.endDate)),
        itemProps: { style },
        project: item.title,
        type: item.type,
        budgetTotal: item.budgetTotal,
        costsTotal: item.costsTotal
      } as ITimelineItem
    })

    return [...items, ...phases]
  }

  /**
   * Fetch data
   *
   * @returns {ITimelineData} Timeline data
   */
  private async _fetchData(): Promise<ITimelineData> {
    try {
      const projects = await this.props.dataAdapter.fetchEncrichedProjects()
      const timelineItems: TimelineContentListModel[] = (
        await this.props.dataAdapter.fetchTimelineContentItems()
      ).timelineItems

      const filteredProjects = projects.filter((project) => {
        return project.startDate !== null && project.endDate !== null
      })

      const filteredTimelineItems = timelineItems.filter((item) => {
        return filteredProjects.some((project) => {
          return project.title.indexOf(item.title) !== -1
        })
      })

      await Promise.all(
        filteredProjects.map(async (project) => {
          const statusReport = (
            await this.props.dataAdapter.fetchDataForTimelineProject(project.siteId)
          ).statusReports[0]
          project['budgetTotal'] = statusReport && statusReport['GtBudgetTotalOWSCURR']
          project['costsTotal'] = statusReport && statusReport['GtCostsTotalOWSCURR']
          project['type'] = strings.ProjectLabel
        })
      )
      const groups = this._transformGroups(filteredProjects)
      const items = this._transformItems(filteredProjects, filteredTimelineItems, groups)
      return { items, groups }
    } catch (error) {
      throw error
    }
  }
}

export { IProjectTimelineProps }
