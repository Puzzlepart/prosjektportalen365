import { get } from '@microsoft/sp-lodash-subset'
import { getId } from '@uifabric/utilities'
import sortArray from 'array-sort'
import { ITimelineData, ITimelineGroup, ITimelineItem } from './types'
import moment from 'moment'
import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
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
import { IProjectTimelineProps, IProjectTimelineState, IProjectTimelineData, ProjectPropertyModel } from './types'
import { ProjectModel, TimelineContentModel } from 'models'
import { BaseWebPartComponent } from '../BaseWebPartComponent'

import { Web } from '@pnp/sp'

import { isEmpty } from 'underscore'
import SPDataAdapter from '../../data'
import { PortalDataService } from 'pp365-shared/lib/services'
import { LogLevel } from '@pnp/logging'

import { stringIsNullOrEmpty } from '@pnp/common'
import { DetailsList, DetailsListLayoutMode, Selection, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { tryParseCurrency } from 'pp365-shared/lib/helpers'
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection'

/**
 * @component ProjectTimeline
 * @extends Component
 */
export class ProjectTimeline extends BaseWebPartComponent<IProjectTimelineProps, IProjectTimelineState> {
  public static defaultProps: Partial<IProjectTimelineProps> = {
    defaultTimeStart: [-1, 'months'],
    defaultTimeEnd: [1, 'years']
  }

  private _portalDataService: PortalDataService
  private _web: Web
  private _selection: Selection;

  /**
   * Constructor
   *
   * @param {IProjectTimelineProps} props Props
   */
  constructor(props: IProjectTimelineProps) {
    super('ProjectTimeline', props, { selectedItem: [], loading: true, showFilterPanel: false, activeFilters: {} })

    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: this.props.hubSite.web,
      siteId: this.props.siteId
    })

    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({ selectedItem: this._selection.getSelection() })
      }
    })

    moment.locale('nb')
  }

  public async componentDidMount(): Promise<void> {
    try {
      const data = await this._fetchData()
      console.log(data)
      this.setState({ data, loading: false })
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

    console.log(this.state)

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
          <div className={styles.timelineList}>
            <div className={styles.commandBar}>
              <CommandBar {...this._getListCommandBarProps()} />
            </div>
            <MarqueeSelection selection={this._selection}>
              <DetailsList
                // onRenderDetailsHeader={this._onRenderDetailsHeader.bind(this)}
                columns={this.state.data.timelineColumns}
                items={this.state.data.timelineListItems}
                onRenderItemColumn={this._onRenderItemColumn.bind(this)}
                selection={this._selection}
                selectionMode={SelectionMode.single}
                layoutMode={DetailsListLayoutMode.justified}
              />
            </MarqueeSelection>
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

  private _onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    if (!column.fieldName) return null
    if (column.onRender) return column.onRender(item, index, column)
    if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
      return get(item, column['fieldNameDisplay'], null)
    }
    const columnValue = get(item, column.fieldName, null)

    switch (column?.data?.type.toLowerCase()) {
      case 'int':
        return columnValue ? parseInt(columnValue) : null
      case 'date':
        return moment(columnValue).format('DD.MM.YYYY')
      case 'datetime':
        return moment(columnValue).format('DD.MM.YYYY')
      case 'currency':
        return tryParseCurrency(columnValue, '').toString().replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ')
      default:
        return columnValue
    }
  }

  // /**
  //  * On render details header
  //  *
  //  * @param {IDetailsHeaderProps} props Props
  //  * @param {IRenderFunction} defaultRender Default render
  //  */
  // private _onRenderDetailsHeader(
  //   props: IDetailsHeaderProps,
  //   defaultRender?: IRenderFunction<IDetailsHeaderProps>
  // ) {
  //   return (
  //     <Sticky
  //       stickyClassName={styles.stickyHeader}
  //       stickyPosition={StickyPositionType.Header}
  //       isScrollSynced={true}>
  //       <div className={styles.header}>
  //         <div className={styles.title}>{strings.TimelineContentListName}</div>
  //       </div>
  //       <div className={styles.infoText}>
  //         <MessageBar>
  //           <div
  //             dangerouslySetInnerHTML={{
  //               __html: strings.ProjectTimelineListInfoText
  //             }}></div>
  //         </MessageBar>
  //       </div>
  //       <div className={styles.headerColumns}>{defaultRender(props)}</div>
  //     </Sticky>
  //   )
  // }

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
      buttonStyles: { root: { border: 'none' } },
      iconOnly: true,
      onClick: (ev) => {
        ev.preventDefault()
        this.setState({ showFilterPanel: true })
      }
    })
    return cmd
  }

  /**
   * Get command bar items
   */
  private _getListCommandBarProps(): ICommandBarProps {
    const cmd: ICommandBarProps = { items: [], farItems: [] }
    cmd.items.push({
      key: getId('NewElement'),
      name: strings.NewElementLabel,
      iconProps: { iconName: 'Add' },
      buttonStyles: { root: { border: 'none' } },
      iconOnly: false,
      onClick: (ev) => {
        ev.preventDefault()
        this.setState({ showFilterPanel: true })
      }
    })
    cmd.items.push({
      key: getId('EditElement'),
      name: strings.EditElementLabel,
      iconProps: { iconName: 'Edit' },
      buttonStyles: { root: { border: 'none' }},
      iconOnly: false,
      disabled: this.state.selectedItem.length === 0,
      href: this.state.selectedItem[0]?.EditFormUrl
    })
    return cmd
  }

  /**
   * Edit form URL with added Source parameter
   */
  public editFormUrl(item: any) {
    return [
      `${this.props.hubSite.url}`,
      `/Lists/${strings.TimelineContentListName}/EditForm.aspx`,
      '?ID=',
      item.Id,
      '&Source=',
      encodeURIComponent(window.location.href)
    ].join('')
  }

  /**
   * Timeline item renderer
   */
  private _itemRenderer(props: ReactCalendarItemRendererProps<any>) {
    const htmlProps = props.getItemProps(props.item.itemProps)

    if (props.item.type === strings.MilestoneLabel)
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
   * Get timeline items and columns
   */
  public async _getProjecttimelineItemsAndColumns() {
    this._web = new Web(this.props.hubSite.url)

    try {
      let [allColumns] = await Promise.all([
        (await this._web.lists
          .getByTitle(strings.TimelineContentListName).defaultView.fields.select('Items')
          .get())['Items']])

      let filterstring: string = allColumns
        .map((x: any) => `(InternalName eq '${x}')`)
        .join(' or ');

      let internalNames: string = await allColumns
        .map((x: any) => `${x}`)
        .join(',');

      let [timelineItems] = await Promise.all([
        await this._web.lists
          .getByTitle(strings.TimelineContentListName)
          .items.select(
            'Id',
            internalNames,
            'SiteIdLookup/Title',
            'SiteIdLookup/GtSiteId',
          ).expand('SiteIdLookup')
          .get()
      ])

      let timelineListItems = timelineItems.filter((item) => item.SiteIdLookup[0].Title === this.props.webTitle)

      let [timelineColumns] = await Promise.all([
        await this._web.lists
          .getByTitle(strings.TimelineContentListName).fields.filter(filterstring)
          .select("InternalName", "Title", "TypeAsString").get()])

      const columns: IColumn[] = timelineColumns.filter((column) => column.InternalName !== 'SiteIdLookup').map((column) => {
        return {
          key: column.InternalName,
          name: column.Title,
          fieldName: column.InternalName,
          data: { type: column.TypeAsString },
          minWidth: 100,
          maxWidth: 150,
          sorting: true,
          isResizable: true,
        }
      })

      console.log(timelineListItems)

      timelineListItems = timelineListItems.map((item) => {
        return { ...item,  EditFormUrl: this.editFormUrl(item) }
      })

      timelineItems = timelineItems.map((item) => {
        const model = new TimelineContentModel(
          item.SiteIdLookup && item.SiteIdLookup[0].GtSiteId,
          item.SiteIdLookup && item.SiteIdLookup[0].Title,
          item.Title,
          item.TimelineType,
          item.GtStartDate,
          item.GtEndDate,
          item.GtBudgetTotal,
          item.GtCostsTotal,
        )
        return model
      })
        .filter((p) => p)


      return [timelineItems, timelineListItems, columns]
    } catch (error) {
      return []
    }
  }

  /**
   * Creating groups based on projects title
   *
   * @returns {ITimelineGroup[]} Timeline groups
   */
  private _transformGroups(projects: ProjectModel[]): ITimelineGroup[] {
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
        title,
        type: 'Prosjekt'
      }
    })
    groups = sortArray(groups, ['type', 'title'])
    return groups
  }

  /**
   * Create items
   *
   * @param {ProjectModel[]} projects Projects
   * @param {TimelineContentModel[]} timelineItems Timeline items
   * @param {ITimelineGroup[]} groups Groups
   *
   * @returns {ITimelineItem[]} Timeline items
   */
  private _transformItems(
    projects: ProjectModel[],
    timelineItems: TimelineContentModel[],
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
        type: 'Prosjekt',
        budgetTotal: project.budgetTotal,
        costsTotal: project.costsTotal
      } as ITimelineItem
    })

    const phases: ITimelineItem[] = timelineItems.filter((item) => item.title === this.props.webTitle).map((item, id) => {
      id += items.length

      const backgroundColor = item.type === strings.PhaseLabel
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
        id: id,
        group: group.id,
        title: item.itemTitle,
        start_time: item.type === strings.MilestoneLabel ? moment(new Date(item.endDate)) : moment(new Date(item.startDate)),
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
   * Transform properties from entity item and configuration
   *
   * @param {IProjectInformationData} data Data
   */
  private _transformProperties({ columns, fields, fieldValuesText }: IProjectTimelineData) {
    const fieldNames: string[] = Object.keys(fieldValuesText).filter((fieldName) => {
      const [field] = fields.filter((fld) => fld.InternalName === fieldName)
      if (!field) return false
      if (
        isEmpty(columns) &&
        ((this.props.showFieldExternal || {})[fieldName] || this.props.skipSyncToHub)
      ) {
        return true
      }
      const [column] = columns.filter((c) => c.internalName === fieldName)
      return column
    })

    const properties = fieldNames.map((fn) => {
      const [field] = fields.filter((fld) => fld.InternalName === fn)
      return new ProjectPropertyModel(field, fieldValuesText[fn])
    })

    return properties
  }

  /**
   * Fetch data
   */
  private async _fetchProjectData(): Promise<Partial<IProjectTimelineState>> {
    try {
      SPDataAdapter.configure(this.props.webPartContext, {
        siteId: this.props.siteId,
        webUrl: this.props.webUrl,
        hubSiteUrl: this.props.hubSite.url,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })

      const [columns, propertiesData] = await Promise.all([
        this._portalDataService.getProjectColumns(),
        SPDataAdapter.project.getPropertiesData()
      ])

      const data: IProjectTimelineData = {
        columns,
        ...propertiesData
      }

      const properties = this._transformProperties(data)

      return { data, properties }
    } catch (error) {
      this.logError('Failed to retrieve data.', '_fetchData', error)
      throw error
    }
  }

  /**
   * Fetch data
   *
   * @returns {ITimelineData} Timeline data
   */
  private async _fetchData(): Promise<ITimelineData> {
    try {
      let projectData = (await this._fetchProjectData()).data.fieldValuesText;

      console.log(projectData)

      const project = new ProjectModel(
        this.props.siteId,
        this.props.siteId,
        this.props.webTitle,
        this.props.webUrl,
        projectData.GtProjectPhase,
        projectData.GtStartDate,
        projectData.GtEndDate,
      )

      project['type'] = strings.ProjectLabel
      project['budgetTotal'] = projectData.GtBudgetTotal
      project['costsTotal'] = projectData.GtCostsTotal

      const [timelineItems, timelineListItems, timelineColumns] = await this._getProjecttimelineItemsAndColumns()

      console.log(timelineColumns)

      const groups = this._transformGroups([project])
      const items = this._transformItems([project], timelineItems, groups)
      return { items, groups, timelineListItems, timelineColumns }
    } catch (error) {
      throw error
    }
  }
}

export { IProjectTimelineProps }
