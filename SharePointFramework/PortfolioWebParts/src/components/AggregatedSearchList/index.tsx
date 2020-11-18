import { stringIsNullOrEmpty } from '@pnp/common'
import { sp } from '@pnp/sp'
import { getId } from '@uifabric/utilities'
import * as arraySort from 'array-sort'
import { IAggregatedSearchListColumn } from 'interfaces'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import {
  ContextualMenu,
  ContextualMenuItemType,
  IContextualMenuItem,
  IContextualMenuProps
} from 'office-ui-fabric-react/lib/ContextualMenu'
import {
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode,
  IGroup,
  SelectionMode
} from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { getObjectValue, isHubSite } from 'shared/lib/helpers'
import { DataSource } from 'shared/lib/models/DataSource'
import { DataSourceService, ExcelExportService } from 'shared/lib/services'
import HubSiteService from 'sp-hubsite-service'
import * as format from 'string-format'
import * as _ from 'underscore'
import styles from './AggregatedSearchList.module.scss'
import { IAggregatedSearchListProps } from './IAggregatedSearchListProps'
import { IAggregatedSearchListState } from './IAggregatedSearchListState'
import { removeMenuBorder } from 'shared/lib/util'

/**
 * @component AggregatedSearchList
 * @extends React.Component
 */
export class AggregatedSearchList extends React.Component<
  IAggregatedSearchListProps,
  IAggregatedSearchListState
> {
  public static defaultProps: Partial<IAggregatedSearchListProps> = {
    showCommandBar: true,
    showSearchBox: true
  }

  /**
   * Constructor
   *
   * @param {IAggregatedSearchListProps} props Props
   */
  constructor(props: IAggregatedSearchListProps) {
    super(props)
    this.state = { isLoading: true, columns: props.columns }
  }

  public async componentDidMount(): Promise<void> {
    ExcelExportService.configure({ name: this.props.title })
    try {
      const { items, selectedDataSource, dataSources } = await this._fetchData()
      this.setState({ items, selectedDataSource, dataSources, isLoading: false })
    } catch (error) {
      this.setState({ error, isLoading: false })
    }
  }

  public render(): React.ReactElement<IAggregatedSearchListProps> {
    if (this.state.isLoading) {
      return (
        <div className={this.props.className}>
          <div className={styles.container}>
            <Spinner
              label={format(strings.LoadingText, this.props.title)}
              type={SpinnerType.large}
            />
          </div>
        </div>
      )
    }
    if (this.state.error) {
      return (
        <div className={this.props.className}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      )
    }

    const { items, columns, groups } = this._getData()

    return (
      <div className={this.props.className}>
        <div className={styles.container}>
          {this._commandBar()}
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
            <SearchBox
              onChange={this._onSearch.bind(this)}
              labelText={this._searchBoxPlaceholderText}
            />
          </div>
          <div className={styles.listContainer}>
            <DetailsList
              items={items}
              columns={columns}
              groups={groups}
              onRenderItemColumn={this._onRenderItemColumn.bind(this)}
              onColumnHeaderClick={this._onColumnHeaderClick.bind(this)}
              onColumnHeaderContextMenu={this._onColumnHeaderContextMenu.bind(this)}
              constrainMode={ConstrainMode.unconstrained}
              layoutMode={DetailsListLayoutMode.fixedColumns}
              selectionMode={SelectionMode.none}
            />
            {this.state.columnContextMenu && <ContextualMenu {...this.state.columnContextMenu} />}
          </div>
        </div>
      </div>
    )
  }

  private get _searchBoxPlaceholderText(): string {
    if (!stringIsNullOrEmpty(this.props.searchBoxPlaceholderText)) {
      return this.props.searchBoxPlaceholderText
    }
    if (this.props.dataSource) {
      return format(strings.SearchBoxPlaceholderText, this.props.dataSource.toLowerCase())
    }
    if (this.state.selectedDataSource) {
      return format(
        strings.SearchBoxPlaceholderText,
        this.state.selectedDataSource.title.toLowerCase()
      )
    }
    return ''
  }

  /**
   * On search
   *
   * Makes the search term lower case and sets state
   *
   * @param {string} searchTerm Search term
   */
  private _onSearch(searchTerm: string): void {
    this.setState({ searchTerm: searchTerm.toLowerCase() })
  }

  /**
   * On data source changed
   *
   * @param {DataSource} dataSource The new data source
   */
  private async _onDataSourceChanged(dataSource: DataSource) {
    const items = await this._fetchItems(dataSource.searchQuery)
    this.setState({ items, selectedDataSource: dataSource })
  }

  /**
   * On render item column
   *
   * @param {any} item Item
   * @param {number} index Index
   * @param {IAggregatedSearchListColumn} column Column
   */
  private _onRenderItemColumn(item: any, index: number, column: IAggregatedSearchListColumn) {
    if (column.onRender) return column.onRender(item, index, column)
    if (!stringIsNullOrEmpty(column.fieldNameDisplay))
      return getObjectValue(item, column.fieldNameDisplay, null)
    return getObjectValue(item, column.fieldName, null)
  }

  /**
   * On column sort
   *
   * @param {IAggregatedSearchListColumn} column The column config
   * @param {boolean} sortDesencing Sort descending
   */
  private _onColumnSort(column: IAggregatedSearchListColumn, sortDesencing: boolean): void {
    const { items, columns } = { ...this.state } as IAggregatedSearchListState
    const itemsSorted = arraySort(items, [column.fieldName], { reverse: !sortDesencing })
    this.setState({
      sortBy: column,
      items: itemsSorted,
      columns: columns.map((col) => {
        col.isSorted = col.key === column.key
        if (col.isSorted) {
          col.isSortedDescending = sortDesencing
        }
        return col
      })
    })
  }

  /**
   * On column group by
   *
   * @param {IAggregatedSearchListColumn} column The column config
   */
  private _onColumnGroupBy(column: IAggregatedSearchListColumn) {
    this.setState((prevState) => ({
      groupBy:
        getObjectValue<string>(prevState, 'groupBy.fieldName', '') === column.fieldName
          ? null
          : column
    }))
  }

  /**
   * On column header click
   *
   * @param {React.MouseEvent<HTMLElement, MouseEvent>} ev Event
   * @param {IAggregatedSearchListColumn} column Column
   */
  private _onColumnHeaderClick(
    ev?: React.MouseEvent<HTMLElement, MouseEvent>,
    column?: IAggregatedSearchListColumn
  ) {
    this._onColumnHeaderContextMenu(column, ev)
  }

  /**
   * On column header context menu
   *
   * @param {IAggregatedSearchListColumn} column Column
   * @param {React.MouseEvent<HTMLElement, MouseEvent>} ev Event
   */
  private _onColumnHeaderContextMenu(
    column?: IAggregatedSearchListColumn,
    ev?: React.MouseEvent<HTMLElement, MouseEvent>
  ) {
    this.setState({
      columnContextMenu: {
        target: ev.currentTarget,
        items: [
          {
            id: getId('SortDesc'),
            key: getId('SortDesc'),
            name: strings.SortDescLabel,
            canCheck: true,
            checked: column.isSorted && column.isSortedDescending,
            onClick: () => this._onColumnSort(column, true)
          },
          {
            id: getId('SortAsc'),
            key: getId('SortAsc'),
            name: strings.SortAscLabel,
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => this._onColumnSort(column, false)
          },
          {
            id: getId('Divider'),
            key: getId('Divider'),
            itemType: ContextualMenuItemType.Divider
          },
          {
            id: getId('GroupBy'),
            key: getId('GroupBy'),
            name: format(strings.GroupByColumnLabel, column.name),
            canCheck: true,
            checked:
              getObjectValue<string>(this.state, 'groupBy.fieldName', '') === column.fieldName,
            disabled: !column.isGroupable,
            onClick: () => this._onColumnGroupBy(column)
          }
        ],
        onDismiss: () => this.setState({ columnContextMenu: null })
      } as IContextualMenuProps
    })
  }

  private _commandBar() {
    const items: ICommandBarItemProps[] = []

    if (this.props.showExcelExportButton) {
      items.push({
        id: getId('ExcelExport'),
        key: getId('ExcelExport'),
        name: strings.ExcelExportButtonLabel,
        iconProps: {
          iconName: 'ExcelDocument',
          styles: { root: { color: 'green !important' } }
        },
        disabled: this.state.isExporting,
        onClick: (ev) => {
          this._exportToExcel(ev)
        }
      })
    }

    const farItems: ICommandBarItemProps[] = []

    if (this.state.selectedDataSource) {
      farItems.push({
        id: getId('DataSource'),
        key: getId('DataSource'),
        name: this.state.selectedDataSource.title,
        iconProps: { iconName: this.state.selectedDataSource.iconName || 'DataConnectionLibrary' },
        disabled: this.state.dataSources.length === 1,
        subMenuProps: {
          items: this.state.dataSources.map((dataSource) => ({
            id: getId(dataSource.title),
            key: getId(dataSource.title),
            name: dataSource.title,
            iconProps: { iconName: dataSource.iconName || 'DataConnectionLibrary' },
            canCheck: true,
            checked: this.state.selectedDataSource.id === dataSource.id,
            onClick: () => {
              this._onDataSourceChanged(dataSource)
            }
          })) as IContextualMenuItem[]
        }
      })
    }

    return (
      <div className={styles.commandBar} hidden={!this.props.showCommandBar}>
        <CommandBar items={removeMenuBorder(items)} farItems={removeMenuBorder(farItems)} />
      </div>
    )
  }

  /**
   * Create groups
   *
   * @param {any[]} items Items
   * @param {IAggregatedSearchListColumn[]} columns Columns
   */
  private _createGroups(items: any[], columns: IAggregatedSearchListColumn[]) {
    const { groupBy, sortBy } = { ...this.state } as IAggregatedSearchListState
    if (!groupBy) return { items, columns, groups: null }
    const itemsSort = { props: [groupBy.fieldName], opts: { reverse: false } }
    if (sortBy) {
      itemsSort.props.push(sortBy.fieldName)
      itemsSort.opts.reverse = !sortBy.isSortedDescending
    }
    items = arraySort([...items], itemsSort.props, itemsSort.opts)
    const groupNames: string[] = items.map((g) =>
      getObjectValue<string>(g, groupBy.fieldName, strings.NotSet)
    )
    const uniqueGroupNames: string[] = _.uniq(groupNames)
    const groups = uniqueGroupNames
      .sort((a, b) => (a > b ? 1 : -1))
      .map((name, idx) => {
        const count = groupNames.filter((n) => n === name).length
        const group: IGroup = {
          key: `Group_${idx}`,
          name: `${groupBy.name}: ${name}`,
          startIndex: groupNames.indexOf(name, 0),
          count,
          isShowingAll: count === items.length,
          isDropEnabled: false,
          isCollapsed: false
        }
        return group
      })
    return { items, columns, groups }
  }

  /**
   * Get data
   */
  private _getData() {
    const { items, columns, searchTerm } = { ...this.state } as IAggregatedSearchListState
    let filteredItems = items
    if (searchTerm) {
      filteredItems = items.filter((item) => {
        return (
          columns.filter((col) => {
            const colValue = getObjectValue<string>(item, col.fieldName, '')
            return typeof colValue === 'string' && colValue.toLowerCase().indexOf(searchTerm) !== -1
          }).length > 0
        )
      })
    }

    return this._createGroups(filteredItems, columns)
  }

  /**
   * Export to Excel
   *
   * @param {React.MouseEvent<any> | React.KeyboardEvent<any>} ev Event
   */
  private async _exportToExcel(
    ev: React.MouseEvent<any> | React.KeyboardEvent<any>
  ): Promise<void> {
    ev.preventDefault()
    this.setState({ isExporting: true })
    const { items, columns } = this._getData()
    try {
      await ExcelExportService.export(items, columns)
      this.setState({ isExporting: false })
    } catch (error) {
      this.setState({ isExporting: false })
    }
  }

  /**
   * Fetch items
   *
   * @param {string} queryTemplate Query template
   */
  private async _fetchItems(queryTemplate: string) {
    const response = await sp.search({
      QueryTemplate: queryTemplate,
      Querytext: '*',
      RowLimit: 500,
      TrimDuplicates: false,
      SelectProperties: this.props.selectProperties || [
        'Path',
        'SPWebUrl',
        ...this.props.columns.map((col) => col.key)
      ]
    })
    return this.props.postTransform
      ? this.props.postTransform(response.PrimarySearchResults)
      : response.PrimarySearchResults
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<{
    items: any[]
    selectedDataSource: DataSource
    dataSources?: DataSource[]
  }> {
    const { queryTemplate, pageContext, dataSource, dataSourceCategory } = this.props
    try {
      let selectedDataSource: DataSource = null
      let dataSources: DataSource[] = []
      if (stringIsNullOrEmpty(queryTemplate)) {
        let web = sp.web
        if (!isHubSite(pageContext)) {
          web = (await HubSiteService.GetHubSite(sp, pageContext)).web
        }
        const dataSourceService = new DataSourceService(web)
        if (!stringIsNullOrEmpty(dataSource)) {
          selectedDataSource = await dataSourceService.getByName(dataSource)
          dataSources.push(selectedDataSource)
        } else if (!stringIsNullOrEmpty(dataSourceCategory)) {
          dataSources = await dataSourceService.getByCategory(dataSourceCategory)
          selectedDataSource = dataSources.filter((d) => d.isDefault)[0]
        }
      }
      const items = await this._fetchItems(queryTemplate || selectedDataSource.searchQuery)
      return {
        items,
        selectedDataSource,
        dataSources
      }
    } catch (error) {
      throw format(strings.DataSourceError, dataSource)
    }
  }
}

export { IAggregatedSearchListProps }
