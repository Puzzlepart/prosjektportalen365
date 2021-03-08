import { get } from '@microsoft/sp-lodash-subset'
import { sp } from '@pnp/sp'
import { getId } from '@uifabric/utilities'
import sortArray from 'array-sort'
import {
  IAllocationSearchResult,
  ITimelineData,
  ITimelineGroup,
  ITimelineItem,
  TimelineGroupType
} from 'interfaces'
import moment from 'moment'
import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'PortfolioWebPartsStrings'
import { tryParsePercentage } from 'pp365-shared/lib/helpers'
import { DataSourceService } from 'pp365-shared/lib/services'
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

/**
 * @component ProjectTimeline
 * @extends Component
 */
export class ProjectTimeline extends Component<
  IProjectTimelineProps,
  IProjectTimelineState
> {
  public static defaultProps: Partial<IProjectTimelineProps> = {
    itemBgColor: '51,153,51',
    itemAbsenceBgColor: '26,111,179',
    defaultTimeStart: [-1, 'months'],
    defaultTimeEnd: [1, 'years'],
    selectProperties: [
      'Path',
      'SPWebUrl',
      'ContentTypeId',
      'SiteTitle',
      'SiteName',
      'RefinableString71',
      'RefinableString72',
      'GtResourceLoadOWSNMBR',
      'GtResourceAbsenceOWSCHCS',
      'GtStartDateOWSDATE',
      'GtEndDateOWSDATE',
      'GtAllocationStatusOWSCHCS',
      'GtAllocationCommentOWSMTXT'
    ]
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
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  public render(): React.ReactElement<IProjectTimelineProps> {
    if (this.state.loading) return null
    if (this.state.error) {
      return (
        <div className={styles.projectTimeline}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      )
    }

    const { groups, items } = this._getFilteredData()

    return (
      <div className={styles.projectTimeline}>
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
              sidebarWidth={250}
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
    return (
      <div
        {...htmlProps}
        className={`${styles.timelineItem} rc-item`}
        onClick={(event) => this._onItemClick(event, props.item)}>
        <div
          className={`${styles.itemContent} rc-item-content`}
          style={{ maxHeight: `${props.itemContext.dimensions.height}` }}>
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
   * Creating groups based on user property (RefinableString71) on the search result, with fallback to role (RefinableString72)
   *
   * @param {IAllocationSearchResult[]} searchResults Search results
   *
   * @returns {ITimelineGroup[]} Timeline groups
   */
  private _transformGroups(searchResults: IAllocationSearchResult[]): ITimelineGroup[] {
    const groupNames: string[] = searchResults
      .map((res) => {
        const name = res.RefinableString71 || `${res.RefinableString72}|R`
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
   * @param {IAllocationSearchResult[]} searchResults Search results
   * @param {ITimelineGroup[]} groups Groups
   *
   * @returns {ITimelineItem[]} Timeline items
   */
  private _transformItems(
    searchResults: IAllocationSearchResult[],
    groups: ITimelineGroup[]
  ): ITimelineItem[] {
    const items: ITimelineItem[] = searchResults.map((res, id) => {
      const group = _.find(
        groups,
        (grp) => [res.RefinableString71, res.RefinableString72].indexOf(grp.title) !== -1
      )
      const allocation = tryParsePercentage(res.GtResourceLoadOWSNMBR, false, 0) as number
      const isAbsence = res.ContentTypeId.indexOf('0x010029F45E75BA9CE340A83EFFB2927E11F4') !== -1
      const itemOpacity = allocation < 30 ? 0.3 : allocation / 100
      const itemColor = allocation < 40 ? '#000' : '#fff'
      const backgroundColor = isAbsence ? this.props.itemAbsenceBgColor : this.props.itemBgColor
      const style: React.CSSProperties = {
        color: itemColor,
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background: `rgb(${backgroundColor})`,
        backgroundColor: `rgba(${backgroundColor}, ${itemOpacity})`
      }
      return {
        id,
        group: group.id,
        title: isAbsence
          ? `${res.GtResourceAbsenceOWSCHCS} (${allocation}%)`
          : `${res.RefinableString72} - ${res.SiteTitle} (${allocation}%)`,
        start_time: moment(new Date(res.GtStartDateOWSDATE)),
        end_time: moment(new Date(res.GtEndDateOWSDATE)),
        allocation,
        itemProps: { style },
        project: res.SiteTitle,
        projectUrl: res.SiteName,
        role: res.RefinableString72,
        resource: res.RefinableString71,
        props: res
      } as ITimelineItem
    })
    return items
  }

  /**
   * Fetch data
   *
   * @returns {ITimelineData} Timeline data
   */
  private async _fetchData(): Promise<ITimelineData> {
    const dataSource = await new DataSourceService(sp.web).getByName(this.props.dataSource)
    if (!dataSource) throw format(strings.DataSourceNotFound, this.props.dataSource)
    try {
      const results = (
        await sp.search({
          QueryTemplate: dataSource.searchQuery,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: this.props.selectProperties
        })
      ).PrimarySearchResults as IAllocationSearchResult[]
      const groups = this._transformGroups(results)
      const items = this._transformItems(results, groups)
      return { items, groups }
    } catch (error) {
      throw error
    }
  }
}

export { IProjectTimelineProps }
