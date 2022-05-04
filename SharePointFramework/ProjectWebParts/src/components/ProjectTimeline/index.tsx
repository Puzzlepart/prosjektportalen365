import { get } from '@microsoft/sp-lodash-subset'
import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { sp, Web } from '@pnp/sp'
import { getId } from '@uifabric/utilities'
import sortArray from 'array-sort'
import moment from 'moment'
import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  Selection,
  SelectionMode
} from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import {
  FilterPanel,
  IFilterItemProps,
  IFilterProps
} from 'pp365-portfoliowebparts/lib/components/FilterPanel'
import { DetailsCallout } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/DetailsCallout'
import { Timeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/Timeline'
import { ProjectListModel, TimelineContentListModel } from 'pp365-portfoliowebparts/lib/models'
import { tryParseCurrency } from 'pp365-shared/lib/helpers'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
import _ from 'underscore'
import { BaseWebPartComponent } from '../BaseWebPartComponent'
import styles from './ProjectTimeline.module.scss'
import {
  IProjectTimelineProps,
  IProjectTimelineState,
  ITimelineData,
  ITimelineGroup,
  ITimelineItem
} from './types'

/**
 * @component ProjectTimeline (Project webpart)
 * @extends Component
 */
export class ProjectTimeline extends BaseWebPartComponent<
  IProjectTimelineProps,
  IProjectTimelineState
> {
  private _selection: Selection
  private _web: Web

  /**
   * Constructor
   *
   * @param props Props
   */
  constructor(props: IProjectTimelineProps) {
    super('ProjectTimeline', props, {
      selectedItem: [],
      loading: true,
      showFilterPanel: false,
      activeFilters: {}
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
      const [data, timelineConfiguration] = await this._fetchData()
      this.setState({ data, timelineConfiguration, loading: false })
    } catch (error) {
      this.setState({ error: error.message || error.status, loading: false })
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
          {this.props.showFilterButton && (
            <div className={styles.commandBar}>
              <CommandBar {...this._getCommandBarProps()} />
            </div>
          )}
          {this.props.showTitle && (
            <div className={styles.header}>
              <div className={styles.title}>{this.props.title}</div>
            </div>
          )}
          {this.props.showInfoMessage && (
            <div className={styles.infoText}>
              <MessageBar>
                <div
                  dangerouslySetInnerHTML={{
                    __html: format(
                      this.props.infoText
                        ? this.props.infoText
                        : strings.ProjectTimelineListInfoText,
                      encodeURIComponent(window.location.href)
                    )
                  }}></div>
              </MessageBar>
            </div>
          )}
          {this.props.showTimeline && (
            <Timeline
              defaultTimeStart={[-6, 'months']}
              defaultTimeEnd={[2, 'years']}
              _onItemClick={this._onItemClick.bind(this)}
              groups={groups}
              items={items}
            />
          )}
          {this.props.showTimelineList && (
            <div className={styles.timelineList}>
              {this.props.showCmdTimelineList && (
                <div className={styles.commandBar}>
                  <CommandBar {...this._getListCommandBarProps()} />
                </div>
              )}
              <DetailsList
                columns={this.state.data.timelineColumns}
                items={this.state.data.timelineListItems}
                onRenderItemColumn={this._onRenderItemColumn.bind(this)}
                selection={this._selection}
                selectionMode={
                  this.props.isSelectionModeNone ? SelectionMode.none : SelectionMode.single
                }
                layoutMode={DetailsListLayoutMode.justified}
              />
            </div>
          )}
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
            timelineItem={this.state.showDetails}
            onDismiss={() => this.setState({ showDetails: null })}
          />
        )}
      </div>
    )
  }

  /**
   * On render item column
   *
   * @param item Item
   * @param index Index
   * @param column Column
   */
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
        return columnValue && moment(columnValue).format('DD.MM.YYYY')
      case 'datetime':
        return columnValue && moment(columnValue).format('DD.MM.YYYY')
      case 'currency':
        return tryParseCurrency(columnValue)
      case 'lookup':
        return columnValue && columnValue.Title
      default:
        return columnValue
    }
  }

  /**
   * Get filtered data
   */
  private _getFilteredData(): ITimelineData {
    const { activeFilters, data } = { ...this.state } as IProjectTimelineState
    const activeFiltersKeys = Object.keys(activeFilters)
    data.items = sortArray(data.items, 'data.sortOrder')

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
    const config = this.state.timelineConfiguration
    const columns = [{ fieldName: 'data.type', name: strings.TypeLabel }]
    const hiddenItems = (config.filter((item) => !item?.GtTimelineFilter)).map((item) => item.Title)

    return columns.map((col) => ({
      column: { key: col.fieldName, minWidth: 0, ...col },
      items: this.state.data.items
        .filter((item) => !hiddenItems.includes(item.data?.type))
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
   * Get command bar items
   */
  private _getListCommandBarProps(): ICommandBarProps {
    const cmd: ICommandBarProps = { items: [], farItems: [] }
    cmd.items.push({
      key: getId('NewItem'),
      name: strings.NewItemLabel,
      iconProps: { iconName: 'Add' },
      buttonStyles: { root: { border: 'none' } },
      onClick: () => {
        this._redirectNewTimelineItem()
      }
    })
    cmd.items.push({
      key: getId('EditItem'),
      name: strings.EditItemLabel,
      iconProps: { iconName: 'Edit' },
      buttonStyles: { root: { border: 'none' } },
      disabled: this.state.selectedItem.length === 0,
      href: this.state.selectedItem[0]?.EditFormUrl
    })
    cmd.farItems.push({
      key: getId('DeleteItem'),
      name: strings.DeleteItemLabel,
      iconProps: { iconName: 'Delete' },
      buttonStyles: { root: { border: 'none' } },
      disabled: this.state.selectedItem.length === 0,
      onClick: () => {
        this._deleteTimelineItem(this.state.selectedItem[0])
      }
    })
    return cmd
  }

  /**
   * Create new timeline item and send the user to the edit form
   */
  private async _redirectNewTimelineItem() {
    const [project] = (
      await this._web.lists
        .getByTitle(strings.ProjectsListName)
        .items.select('Id', 'GtSiteId')
        .get()
    ).filter(({ GtSiteId }) => GtSiteId === this.props.siteId)

    const properties: TypedHash<any> = {
      Title: 'Nytt element på tidslinjen',
      GtSiteIdLookupId: project.Id
    }

    Logger.log({
      message: '(TimelineItem) _redirectNewTimelineItem: Created new timeline item',
      data: { fieldValues: properties },
      level: LogLevel.Info
    })

    const itemId = await this._addTimelineItem(properties)
    document.location.hash = ''
    document.location.href = this.editFormUrl(itemId)
  }

  /**
   * Add timeline item
   *
   * @param properties Properties
   */
  public async _addTimelineItem(properties: TypedHash<any>): Promise<any> {
    const list = this._web.lists.getByTitle(strings.TimelineContentListName)
    const itemAddResult = await list.items.add(properties)
    return itemAddResult.data
  }

  /**
   * Delete timelineitem
   *
   * @param item Item
   */
  private async _deleteTimelineItem(item: any) {
    const list = this._web.lists.getByTitle(strings.TimelineContentListName)
    await list.items.getById(item.Id).delete()
    try {
      const [data, timelineConfiguration] = await this._fetchData()
      this.setState({ data, timelineConfiguration, loading: false })
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  /**
   * Edit form URL with added Source parameter generated from the item ID
   *
   * @param item Item
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
   * On item click
   *
   * @param event Event
   * @param item Item
   */
  private _onItemClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>, item: ITimelineItem) {
    this.setState({ showDetails: { element: event.currentTarget, item } })
  }

  /**
   * Get timeline items and columns
   */
  public async getTimelineData() {
    this._web = new Web(this.props.hubSite.url)
    let projectDeliveries = []

    try {
      const [timelineConfig] = await Promise.all([
        await this.props.hubSite.web.lists
          .getByTitle(strings.TimelineConfigurationListName)
          .items.select(
            'Title',
            'GtSortOrder',
            'GtHexColor',
            'GtElementType',
            'GtShowElementPortfolio',
            'GtShowElementProgram',
            'GtTimelineFilter',
          )
          .get()
      ])

      if (this.props.showProjectDeliveries) {
        [projectDeliveries] = await Promise.all([
          await sp.web.lists
            .getByTitle(this.props.projectDeliveriesListName)
            .items.select(
              'Title',
              'GtDeliveryDescription',
              'GtDeliveryStartTime',
              'GtDeliveryEndTime',
            )
            .get()
        ])

        projectDeliveries = projectDeliveries
          .map((item) => {
            const config = _.find(timelineConfig, (col) => col.Title === this.props.configItemTitle)
            const model = new TimelineContentListModel(
              this.props.siteId,
              this.props.webTitle,
              item.Title,
              config && config.Title || this.props.configItemTitle,
              config && config.GtSortOrder || 90,
              config && config.GtHexColor || '#384f61',
              config && config.GtElementType || strings.BarLabel,
              config && config.GtShowElementPortfolio || false,
              config && config.GtShowElementProgram || false,
              config && config.GtTimelineFilter || true,
              item.GtDeliveryStartTime,
              item.GtDeliveryEndTime,
              null,
              null,
              null,
              null,
              item.GtDeliveryDescription
            )
            return model
          })
          .filter((t) => t)

      }

      const [allColumns] = await Promise.all([
        (
          await this._web.lists
            .getByTitle(strings.TimelineContentListName)
            .defaultView.fields.select('Items')
            .get()
        )['Items']
      ])

      const filterstring: string = allColumns
        .map((col: string) => `(InternalName eq '${col}')`)
        .join(' or ')

      const internalNames: string = await allColumns.map((col: string) => `${col}`).join(',')

      let [timelineContentItems] = await Promise.all([
        await this._web.lists
          .getByTitle(strings.TimelineContentListName)
          .items.select(
            internalNames,
            'Id',
            'GtTimelineTypeLookup/Title',
            'GtSiteIdLookupId',
            'GtSiteIdLookup/Title',
            'GtSiteIdLookup/GtSiteId'
          )
          .top(500)
          .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
          .get()
      ])

      let timelineListItems = timelineContentItems.filter(
        (item) => item.GtSiteIdLookup.Title === this.props.webTitle
      )

      const [timelineColumns] = await Promise.all([
        await this._web.lists
          .getByTitle(strings.TimelineContentListName)
          .fields.filter(filterstring)
          .select('InternalName', 'Title', 'TypeAsString')
          .get()
      ])

      const columns: IColumn[] = timelineColumns
        .filter((column) => column.InternalName !== 'GtSiteIdLookup')
        .map((column) => {
          return {
            key: column.InternalName,
            name: column.Title,
            fieldName: column.InternalName,
            data: { type: column.TypeAsString },
            onColumnClick: this._onColumnClick.bind(this),
            minWidth: 150,
            maxWidth: 200,
            sorting: true,
            isResizable: true
          }
        })

      timelineListItems = timelineListItems.map((item) => {
        return { ...item, EditFormUrl: this.editFormUrl(item) }
      })

      timelineContentItems = timelineContentItems
        .filter((item) => item.GtSiteIdLookup.Title === this.props.webTitle)
        .map((item) => {
          const type = item.GtTimelineTypeLookup && item.GtTimelineTypeLookup.Title
          const config = _.find(timelineConfig, (col) => col.Title === type)

          const model = new TimelineContentListModel(
            item.GtSiteIdLookup?.GtSiteId,
            item.GtSiteIdLookup?.Title,
            item.Title,
            config && config.Title,
            config && config.GtSortOrder,
            config && config.GtHexColor,
            config && config.GtElementType,
            config && config.GtShowElementPortfolio,
            config && config.GtShowElementProgram,
            config && config.GtTimelineFilter,
            item.GtStartDate,
            item.GtEndDate,
            item.GtBudgetTotal,
            item.GtCostsTotal
          )
          return model
        })
        .filter((t) => t)

      timelineContentItems = [...timelineContentItems, ...projectDeliveries]

      return [timelineContentItems, timelineListItems, columns, timelineConfig]
    } catch (error) {
      return []
    }
  }

  /**
   * For sorting detailslist on column click
   *
   * @param event Event
   * @param column Column
   */
  private _onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    const newColumns: IColumn[] = this.state.data.timelineColumns.slice()
    const currColumn: IColumn = newColumns.filter((currCol) => column.key === currCol.key)[0]
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending
        currColumn.isSorted = true
      } else {
        newCol.isSorted = false
        newCol.isSortedDescending = true
      }
    })
    const newItems = this._copyAndSort(
      this.state.data.timelineListItems,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      currColumn.fieldName!,
      currColumn.isSortedDescending
    )
    this.setState({
      data: { ...this.state.data, timelineColumns: newColumns, timelineListItems: newItems }
    })
  }

  /**
   * Copies and sorts items based on columnKey in the timeline detailslist
   *
   * @param items timelineListItems
   * @param columnKey Column key
   * @param isSortedDescending Is Sorted Descending?
   * @returns sorted timeline list items
   */
  private _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
    const key = columnKey as keyof T
    return items
      .slice(0)
      .sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1))
  }

  /**
   * Creating groups based on projects title
   *
   * @param projects Projects
   *
   * @returns Timeline groups
   */
  private _transformGroups(projects: ProjectListModel[]): ITimelineGroup[] {
    const groups: ITimelineGroup[] = _.uniq(projects
      .map((project) => project.title))
      .map((title, id) => {
        return {
          id,
          title
        }
      })
    return sortArray(groups, ['type', 'title'])
  }

  /**
   * Transform items for timeline
   *
   * @param timelineItems Timeline items
   *
   * @returns Timeline items
   */
  private _transformItems(
    timelineItems: TimelineContentListModel[]
  ): ITimelineItem[] {
    const items: ITimelineItem[] = timelineItems.map((item, id) => {
      const style: React.CSSProperties = {
        color: 'white',
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background:
          item.elementType !== strings.BarLabel
            ? 'transparent'
            : item.hexColor || '#f35d69',
        backgroundColor:
          item.elementType !== strings.BarLabel
            ? 'transparent'
            : item.hexColor || '#f35d69'
      }
      return {
        id,
        group: 0,
        title:
          item.type === strings.ProjectLabel
            ? format(strings.ProjectTimelineItemInfo, item.title)
            : item.itemTitle,
        start_time:
          item.elementType !== strings.BarLabel
            ? moment(new Date(item.endDate))
            : moment(new Date(item.startDate)),
        end_time: moment(new Date(item.endDate)),
        itemProps: { style },
        project: item.title,
        projectUrl: item.url,
        data: {
          phase: item.phase,
          description: item.description,
          type: item.type,
          budgetTotal: item.budgetTotal,
          costsTotal: item.costsTotal,
          sortOrder: item.sortOrder,
          hexColor: item.hexColor,
          elementType: item.elementType,
          filter: item.timelineFilter
        }
      } as ITimelineItem
    })
    return items
  }

  /**
   * Fetch project data
   */
  private async _fetchProjectData(): Promise<any> {
    try {
      const [projectData, timelineConfig] = await Promise.all([
        this.props.hubSite.web.lists
          .getByTitle(strings.ProjectsListName)
          .items.select(
            'Id',
            'GtStartDate',
            'GtEndDate',
          )
          .filter(`GtSiteId eq '${this.props.siteId}'`)
          .get(),
        this.props.hubSite.web.lists
          .getByTitle(strings.TimelineConfigurationListName)
          .items.select(
            'Title',
            'GtSortOrder',
            'GtHexColor',
            'GtElementType',
            'GtShowElementPortfolio',
            'GtShowElementProgram',
            'GtTimelineFilter',
          )
          .get()
      ])

      const config = _.find(timelineConfig, (col) => col.Title === strings.ProjectLabel)
      return {
        id: projectData && projectData[0].Id,
        startDate: projectData && projectData[0].GtStartDate,
        endDate: projectData && projectData[0].GtEndDate,
        type: strings.ProjectLabel,
        sortOrder: config && config.GtSortOrder,
        hexColor: config && config.GtHexColor,
        elementType: config && config.GtElementType,
        showElementPortfolio: config && config.GtShowElementPortfolio,
        showElementProgram: config && config.GtShowElementProgram,
        timelineFilter: config && config.GtTimelineFilter,
      }

    } catch (error) {
      this.logError('Failed to retrieve data.', '_fetchData', error)
      throw error
    }
  }

  /**
   * Fetch data
   *
   * @returns Timeline data
   */
  private async _fetchData(): Promise<[ITimelineData, any]> {
    try {
      const projectData = await this._fetchProjectData()

      const project = {
        siteId: this.props.siteId,
        groupId: this.props.siteId,
        title: this.props.webTitle,
        url: this.props.webUrl,
        ...projectData
      }

      const [timelineContentItems, timelineListItems, timelineColumns, timelineConfig] = await this.getTimelineData()
      const timelineItems = [...timelineContentItems, ...[project]]
      const groups = this._transformGroups([project])
      const items = this._transformItems(timelineItems)
      return [{ items, groups, timelineListItems, timelineColumns }, timelineConfig]
    } catch (error) {
      throw error
    }
  }
}

export { IProjectTimelineProps }
