import {
  ContextualMenuItemType, format, getId, IContextualMenuProps, IDetailsHeaderProps, IGroup, IRenderFunction, MessageBarType, SearchBox, Selection, Sticky,
  StickyPositionType
} from '@fluentui/react'
import { UrlQueryParameterCollection } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/common'
import sortArray from 'array-sort'
import * as uniq from 'array-unique'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import { PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import ExcelExportService from 'pp365-shared/lib/services/ExcelExportService'
import { parseUrlHash, redirect, setUrlHash } from 'pp365-shared/lib/util'
import React, { Component } from 'react'
import * as _ from 'underscore'
import { IFilterItemProps, IFilterProps } from '../FilterPanel'
import styles from './PortfolioOverview.module.scss'
import {
  IPortfolioOverviewHashStateState,
  IPortfolioOverviewProps,
  IPortfolioOverviewState,
  PortfolioOverviewErrorMessage
} from './types'

/**
 * @component PortfolioOverview
 * @extends Component
 */
export class PortfolioOverview extends Component<IPortfolioOverviewProps, IPortfolioOverviewState> {
  public static defaultProps: Partial<IPortfolioOverviewProps> = {}
  private _selection: Selection
  private _onSearchDelay: number
  private _layerHostId = getId('layerHost')

  constructor(props: IPortfolioOverviewProps) {
    super(props)
    this.state = {
      loading: true,
      isCompact: false,
      searchTerm: '',
      activeFilters: {},
      items: [],
      columns: []
    }
    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({ selectedItems: this._selection.getSelection() })
      }
    })
  }

  public async componentDidMount() {
    ExcelExportService.configure({ name: this.props.title })
    try {
      const data = await this._fetchInitialData()
      this.setState({ ...data, loading: false })
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  public UNSAFE_componentWillUpdate(
    _nextProps: IPortfolioOverviewProps,
    { currentView, groupBy }: IPortfolioOverviewState
  ) {
    const obj: IPortfolioOverviewHashStateState = {}
    if (currentView) obj.viewId = currentView.id.toString()
    if (groupBy) obj.groupBy = groupBy.fieldName
    setUrlHash<IPortfolioOverviewHashStateState>(obj)
  }

  public render(): React.ReactElement<IPortfolioOverviewProps> {
    return (
      <div>
        909d00a8-c563-4b52-a7a4-1fb5876f9058
      </div>
    )
  }

  private get _searchBoxPlaceholderText() {
    if (!this.state.currentView) return ''
    return format(strings.SearchBoxPlaceholderText, this.state.currentView.title.toLowerCase())
  }

  /**
   * On search
   *
   * @param _event Event
   * @param searchTerm Search term
   * @param delay Delay in ms
   */
  private _onSearch(
    _event: React.ChangeEvent<HTMLInputElement>,
    searchTerm: string,
    delay: number = 600
  ) {
    clearTimeout(this._onSearchDelay)
    this._onSearchDelay = setTimeout(() => {
      this.setState({ searchTerm: searchTerm.toLowerCase() })
    }, delay)
  }

  /**
   * Get filters
   */
  private _getFilters(): IFilterProps[] {
    if (!this.state.currentView) return []
    const selectedFilters = this.props.configuration.refiners.filter(
      (ref) => this.state.currentView.refiners.indexOf(ref) !== -1
    )
    const filters = selectedFilters.map((column) => {
      const uniqueValues = uniq(
        // eslint-disable-next-line prefer-spread
        [].concat.apply(
          [],
          this.state.items.map((i) => get(i, column.fieldName, '').split(';'))
        )
      )
      let items: IFilterItemProps[] = uniqueValues
        .filter((value: string) => !stringIsNullOrEmpty(value))
        .map((value: string) => ({ name: value, value }))
      items = items.sort((a, b) => (a.value > b.value ? 1 : -1))
      return { column, items }
    })

    const activeFilters = this.state.activeFilters
    if (!_.isEmpty(activeFilters)) {
      const filteredFields = Object.keys(activeFilters)
      filteredFields.forEach((key) => {
        filters.forEach((filter) => {
          if (filter.column.fieldName === key) {
            activeFilters[key].forEach((value) => {
              filter.items.forEach((item) => {
                if (value === item.name) {
                  item.selected = true
                }
              })
            })
          }
        })
      })
    }

    return filters
  }

  /**
   * On filter change
   *
   * @param column Column
   * @param selectedItems Selected items
   */
  private _onFilterChange(column: ProjectColumn, selectedItems: IFilterItemProps[]) {
    const { activeFilters } = { ...this.state } as IPortfolioOverviewState
    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
    } else {
      delete activeFilters[column.fieldName]
    }
    this.setState({ activeFilters })
  }

  /**
   * On column sort
   *
   * @param column The column config
   * @param sortDesencing Sort descending
   */
  private _onColumnSort(column: ProjectColumn, sortDesencing: boolean): void {
    const { items, columns } = { ...this.state } as IPortfolioOverviewState
    const itemsSorted = sortArray(items, [column.fieldName], { reverse: !sortDesencing })
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
   * @param column The column config
   */
  private _onColumnGroupBy(column: ProjectColumn) {
    this.setState((prevState) => ({
      groupBy: get<string>(prevState, 'groupBy.fieldName', '') === column.fieldName ? null : column
    }))
  }

  /**
   * On render details header
   *
   * @param props Props
   * @param defaultRender Default render
   */
  private _onRenderDetailsHeader(
    props: IDetailsHeaderProps,
    defaultRender?: IRenderFunction<IDetailsHeaderProps>
  ) {
    return (
      <Sticky
        stickyClassName={styles.stickyHeader}
        stickyPosition={StickyPositionType.Header}
        isScrollSynced={true}>
        <div className={styles.header}>
          <div className={styles.title}>{this.props.title}</div>
        </div>
        <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
          <SearchBox
            onChange={this._onSearch.bind(this)}
            placeholder={this._searchBoxPlaceholderText}
          />
        </div>
        <div className={styles.headerColumns}>{defaultRender(props)}</div>
      </Sticky>
    )
  }

  /**
   * On column header click
   *
   * @param ev Event
   * @param column Column
   */
  private _onColumnHeaderClick(
    ev?: React.MouseEvent<HTMLElement, MouseEvent>,
    column?: ProjectColumn
  ) {
    this._onColumnHeaderContextMenu(column, ev)
  }

  /**
   * On column header context menu
   *
   * @param column Column
   * @param ev Event
   */
  private _onColumnHeaderContextMenu(
    column?: ProjectColumn,
    ev?: React.MouseEvent<HTMLElement, MouseEvent>
  ) {
    if (column.key === 'AddColumn') return
    this.setState({
      columnContextMenu: {
        target: ev.currentTarget,
        items: [
          {
            key: 'SORT_DESC',
            name: strings.SortDescLabel,
            canCheck: true,
            checked: column.isSorted && column.isSortedDescending,
            onClick: () => this._onColumnSort(column, true)
          },
          {
            key: 'SORT_ASC',
            name: strings.SortAscLabel,
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => this._onColumnSort(column, false)
          },
          {
            key: 'DIVIDER_01',
            itemType: ContextualMenuItemType.Divider
          },
          {
            key: 'FILTER_BY',
            name: strings.FilterBy,
            canCheck: true,
            checked: false,
            disabled: true
          },
          {
            key: 'DIVIDER_02',
            itemType: ContextualMenuItemType.Divider
          },
          {
            key: 'GROUP_BY',
            name: format(strings.GroupByColumnLabel, column.name),
            canCheck: true,
            checked: get<string>(this.state, 'groupBy.fieldName', '') === column.fieldName,
            disabled: !column.isGroupable,
            onClick: () => this._onColumnGroupBy(column)
          },
          {
            key: 'DIVIDER_03',
            itemType: ContextualMenuItemType.Divider
          },
          {
            key: 'COLUMN_SETTINGS',
            name: strings.ColumSettingsLabel,
            onClick: () =>
              redirect(`${this.props.configuration.columnUrls.defaultEditFormUrl}?ID=${column.id}`),
            disabled: !this.props.pageContext.legacyPageContext.isSiteAdmin
          }
        ],
        onDismiss: () => this.setState({ columnContextMenu: null })
      } as IContextualMenuProps
    })
  }
  /**
   * Create groups
   *
   * @param items Items
   * @param columns Columns
   */
  private _createGroups(items: any[], columns: ProjectColumn[]) {
    const { groupBy, sortBy } = { ...this.state } as IPortfolioOverviewState
    if (!groupBy) return { items, columns, groups: null }
    const itemsSort = { props: [groupBy.fieldName], opts: { reverse: false } }
    if (sortBy) {
      itemsSort.props.push(sortBy.fieldName)
      itemsSort.opts.reverse = !sortBy.isSortedDescending
    }
    items = sortArray([...items], itemsSort.props, itemsSort.opts)
    const groupNames: string[] = items.map((g) => get<string>(g, groupBy.fieldName, strings.NotSet))
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
   * Get filtered data
   */
  private _getFilteredData() {
    const { searchTerm, activeFilters } = { ...this.state } as IPortfolioOverviewState
    let { items, columns } = { ...this.state } as IPortfolioOverviewState
    items = items.filter((item) => {
      return (
        columns.filter(
          (col) => get(item, col.fieldName, '').toLowerCase().indexOf(searchTerm) !== -1
        ).length > 0
      )
    })

    items = Object.keys(activeFilters)
      .filter((key) => key !== 'SelectedColumns')
      .reduce((arr, key) => {
        return arr.filter((i) => {
          const colValue = get<string>(i, key, '')
          return (
            activeFilters[key].filter((filterValue) => colValue.indexOf(filterValue) !== -1)
              .length > 0
          )
        })
      }, items)
    if (activeFilters.SelectedColumns) {
      columns = this.props.configuration.columns.filter(
        (col) => activeFilters.SelectedColumns.indexOf(col.fieldName) !== -1
      )
    }

    return this._createGroups(items, columns)
  }

  /**
   * Get current view
   *
   * @param hashState Hash state
   */
  private _getCurrentView(hashState: IPortfolioOverviewHashStateState): PortfolioOverviewView {
    const viewIdUrlParam = new UrlQueryParameterCollection(document.location.href).getValue(
      'viewId'
    )
    const { configuration, defaultViewId } = this.props
    const { views } = configuration
    let currentView = null

    if (viewIdUrlParam) {
      currentView = _.find(views, (v) => v.id.toString() === viewIdUrlParam)
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
      }
    } else if (hashState.viewId) {
      currentView = _.find(views, (v) => v.id.toString() === hashState.viewId)
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
      }
    } else if (defaultViewId) {
      currentView = _.find(views, (v) => v.id.toString() === defaultViewId.toString())
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error)
      }
    } else {
      currentView = _.find(views, (v) => v.isDefaultView)
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.NoDefaultViewMessage, MessageBarType.error)
      }
    }
    return currentView
  }

  /**
   * Fetch initial data
   */
  private async _fetchInitialData(): Promise<Partial<IPortfolioOverviewState>> {
    try {
      const { configuration, pageContext, isParentProject } = this.props
      const hashState = parseUrlHash<IPortfolioOverviewHashStateState>()
      const currentView = this._getCurrentView(hashState)
      const items = isParentProject
        ? await this.props.dataAdapter.fetchDataForViewBatch(
            currentView,
            configuration,
            pageContext.legacyPageContext.hubSiteId
          )
        : await this.props.dataAdapter.fetchDataForView(
            currentView,
            configuration,
            pageContext.legacyPageContext.hubSiteId
          )
      const newState: Partial<IPortfolioOverviewState> = {
        columns: currentView.columns,
        items,
        currentView,
        groupBy: currentView.groupBy
      }
      if (hashState.groupBy && !newState.groupBy) {
        newState.groupBy = _.find(configuration.columns, (fc) => fc.fieldName === hashState.groupBy)
      }
      return newState
    } catch (error) {
      throw error
    }
  }

  /**
   * Changes view, doing a new search
   *
   * @param view View configuration
   */
  private async _onChangeView(view: PortfolioOverviewView) {
    if (this.state.currentView.id === view.id) {
      return
    }
    this.setState({ isChangingView: view })
    const items = this.props.isParentProject
      ? await this.props.dataAdapter.fetchDataForViewBatch(
          view,
          this.props.configuration,
          this.props.pageContext.legacyPageContext.hubSiteId
        )
      : await this.props.dataAdapter.fetchDataForView(
          view,
          this.props.configuration,
          this.props.pageContext.legacyPageContext.hubSiteId
        )
    const updatedState: Partial<IPortfolioOverviewState> = {
      isChangingView: null,
      items,
      currentView: view,
      columns: view.columns,
      groupBy: view.groupBy
    }

    this.setState(updatedState)
  }
}

export { IPortfolioOverviewProps }
