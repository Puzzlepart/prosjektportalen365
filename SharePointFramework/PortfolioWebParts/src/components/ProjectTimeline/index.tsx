import { get } from '@microsoft/sp-lodash-subset'
import { getId } from '@uifabric/utilities'
import sortArray from 'array-sort'
import { ITimelineData, ITimelineGroup, ITimelineItem, TimelineGroupType } from 'interfaces'
import moment from 'moment'
import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'PortfolioWebPartsStrings'
import React, { Component } from 'react'
import Timeline, {
  ReactCalendarGroupRendererProps,
  ReactCalendarItemRendererProps,
  TimelineMarkers,
  TodayMarker
} from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import _ from 'underscore'
import { FilterPanel, IFilterItemProps, IFilterProps } from '../FilterPanel'
import { DetailsCallout } from './DetailsCallout'
import styles from './ProjectTimeline.module.scss'
import './Timeline.overrides.css'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import { ProjectListModel, TimelineContentListModel } from 'models'

/**
 * @component ProjectTimeline
 * @extends Component
 */
export class ProjectTimeline extends Component<IProjectTimelineProps, IProjectTimelineState> {
  public static defaultProps: Partial<IProjectTimelineProps> = {
    defaultTimeStart: [-1, 'months'],
    defaultTimeEnd: [1, 'years']
  }
  /**
   * Constructor
   *
   * @param {IProjectTimelineProps} props Props
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
      console.log(data);
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  public render(): React.ReactElement<IProjectTimelineProps> {
    if (this.state.loading) return null
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
                    strings.ProjectTimelineInfoText,
                    encodeURIComponent(window.location.href)
                  )
                }}></div>
            </MessageBar>
          </div>
          <div className={styles.timeline}>
            <Timeline<any>
              groups={groups}
              items={items}
              stackItems={true}
              canMove={false}
              canChangeGroup={false}
              sidebarWidth={320}
              itemRenderer={this._itemRenderer.bind(this)}
              groupRenderer={this._groupRenderer.bind(this)}
              defaultTimeStart={moment().add(...this.props.defaultTimeStart)}
              defaultTimeEnd={moment().add(...this.props.defaultTimeEnd)}>
              <TimelineMarkers>
                <TodayMarker date={moment().toDate()} />
              </TimelineMarkers>
            </Timeline>
          </div>
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
   * Get filtered data
   */
  private _getFilteredData(): ITimelineData {
    const { activeFilters, data } = { ...this.state } as IProjectTimelineState
    const activeFiltersKeys = Object.keys(activeFilters)
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
   * @param {IColumn} column Column
   * @param {IFilterItemProps[]} selectedItems Selected items
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
      iconOnly: true,
      onClick: (ev) => {
        ev.preventDefault()
        this.setState({ showFilterPanel: true })
      }
    })
    return cmd
  }

  /**
   * Timeline item renderer
   */
  private _itemRenderer(props: ReactCalendarItemRendererProps<any>) {
    const htmlProps = props.getItemProps(props.item.itemProps)

    if (props.item.type === 'Milepæl')
      return (
        <div
          {...htmlProps}
          className={`${styles.timelineItem} rc-item`}
          onClick={(event) => this._onItemClick(event, props.item)}>
          <div
            className={`${styles.itemContent} rc-milestoneitem-content`}
            style={{
              maxHeight: `${props.itemContext.dimensions.height}`,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              width: '22px',
              height: '24px',
              backgroundColor: '#ffc800',
              marginTop: '-2px'
            }}>
          </div>
        </div>

      )

    return (
      <div
        {...htmlProps}
        className={`${styles.timelineItem} rc-item`}
        onClick={(event) => this._onItemClick(event, props.item)}>
        <div
          className={`${styles.itemContent} rc-item-content`}
          style={{ maxHeight: `${props.itemContext.dimensions.height}`, paddingLeft: '8px' }}>
          {props.item.title}
        </div>
      </div>
    )
  }

  /**
   * Timeline group renderer
   */
  private _groupRenderer({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) {
    const style: React.CSSProperties = { display: 'block', width: '100%' }
    if (group.type === TimelineGroupType.Role) {
      style.fontStyle = 'italic'
    }
    return (
      <div>
        <span style={style}>{group.title}</span>
      </div>
    )
  }

  /**
   * On item click
   *
   * @param {React.MouseEvent} event Event
   * @param {ITimelineItem} item Item
   */
  private _onItemClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>, item: ITimelineItem) {
    this.setState({ showDetails: { element: event.currentTarget, data: item } })
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
      const [title, type] = name.split('|')
      return {
        id,
        title,
        type: type === 'R' ? TimelineGroupType.Role : TimelineGroupType.User
      }
    })
    groups = sortArray(groups, ['type', 'title'])
    return groups
  }

  /**
   * Create items
   *
   * @param {ITimelineGroup[]} groups Groups
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
        background: 'tomato',
        backgroundColor: project.type === 'Milepæl' ? 'transparent' : 'tomato'
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

    const phases: ITimelineItem[] = timelineItems.filter((item) => item.type !== 'Prosjekt').map((item, id) => {
      id += items.length

      const backgroundColor = item.type === 'Fase'
        ? '#0078D4'
        : item.type === 'Milepæl'
          ? 'transparent'
          : item.type === 'Delfase'
            ? 'teal'
            : '#484848'

      const group = _.find(groups, (grp) => item.title.indexOf(grp.title) !== -1)
      const style: React.CSSProperties = {
        color: 'white',
        border: 'none',
        cursor: 'auto',
        width: '25px',
        outline: 'none',
        background: backgroundColor,
        backgroundColor: backgroundColor
      }
      return {
        id,
        group: group.id,
        title: item.itemTitle,
        start_time: item.type === 'Milepæl' ? moment(new Date(item.endDate)) : moment(new Date(item.startDate)),
        end_time: moment(new Date(item.endDate)),
        itemProps: { style },
        project: item.title,
        type: item.type,
        budgetTotal: item.budgetTotal,
        costsTotal: item.costsTotal,
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
      let projects = await this.props.dataAdapter.fetchEncrichedProjects()

      await Promise.all(projects.map(async (project) => {
        const statusReport = (await this.props.dataAdapter._fetchDataForTimelineProject(project.siteId)).statusReports[0]
        project['budgetTotal'] = statusReport && statusReport['GtBudgetTotalOWSCURR']
        project['costsTotal'] = statusReport && statusReport['GtCostsTotalOWSCURR']
        project['type'] = 'Prosjekt'
      }))

      let timelineItems: any = (await this.props.dataAdapter._fetchTimelineContentItems()).timelineItems
      console.log(timelineItems)

      const groups = this._transformGroups(projects)
      const items = this._transformItems(projects, timelineItems, groups)
      return { items, groups }
    } catch (error) {
      throw error
    }
  }
}

export { IProjectTimelineProps }
