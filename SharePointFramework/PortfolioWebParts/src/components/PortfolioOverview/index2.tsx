// import {
//   Selection,
//   getId,
//   MessageBar,
//   ScrollablePane,
//   ScrollbarVisibility,
//   MarqueeSelection,
//   ShimmeredDetailsList,
//   ConstrainMode,
//   DetailsListLayoutMode,
//   SelectionMode,
//   LayerHost,
//   ContextualMenu,
//   format,
//   IDetailsHeaderProps,
//   IRenderFunction,
//   Sticky,
//   StickyPositionType,
//   SearchBox,
//   ContextualMenuItemType,
//   IContextualMenuProps,
//   IGroup,
//   MessageBarType
// } from '@fluentui/react'
// import { UrlQueryParameterCollection } from '@microsoft/sp-core-library'
// import { stringIsNullOrEmpty } from '@pnp/common'
// import sortArray from 'array-sort'
// import * as uniq from 'array-unique'
// import * as strings from 'PortfolioWebPartsStrings'
// import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
// import { PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
// import ExcelExportService from 'pp365-shared/lib/services/ExcelExportService'
// import { parseUrlHash, redirect, setUrlHash } from 'pp365-shared/lib/util'
// import React, { Component } from 'react'
// import * as _ from 'underscore'
// import { IFilterItemProps, IFilterProps } from '../FilterPanel'
// import styles from './PortfolioOverview.module.scss'
// import { PortfolioOverviewCommands } from './PortfolioOverviewCommands'
// import { renderItemColumn } from './RenderItemColumn'
// import {
//   IPortfolioOverviewHashStateState,
//   IPortfolioOverviewProps,
//   IPortfolioOverviewState,
//   PortfolioOverviewErrorMessage
// } from './types'

// /**
//  * @component PortfolioOverview
//  * @extends Component
//  */
// export class PortfolioOverview extends Component<IPortfolioOverviewProps, IPortfolioOverviewState> {
//   public static defaultProps: Partial<IPortfolioOverviewProps> = {}
//   private _selection: Selection
//   private _onSearchDelay: number
//   private _layerHostId = getId('layerHost')

//   constructor(props: IPortfolioOverviewProps) {
//     super(props)
//     this.state = {
//       loading: true,
//       isCompact: false,
//       searchTerm: '',
//       activeFilters: {},
//       items: [],
//       columns: []
//     }
//     this._selection = new Selection({
//       onSelectionChanged: () => {
//         this.setState({ selectedItems: this._selection.getSelection() })
//       }
//     })
//   }

//   public async componentDidMount() {
//     ExcelExportService.configure({ name: this.props.title })
//     try {
//       const data = await this._fetchInitialData()
//       this.setState({ ...data, loading: false })
//     } catch (error) {
//       this.setState({ error, loading: false })
//     }
//   }

//   public UNSAFE_componentWillUpdate(
//     _nextProps: IPortfolioOverviewProps,
//     { currentView, groupBy }: IPortfolioOverviewState
//   ) {
//     const obj: IPortfolioOverviewHashStateState = {}
//     if (currentView) obj.viewId = currentView.id.toString()
//     if (groupBy) obj.groupBy = groupBy.fieldName
//     setUrlHash<IPortfolioOverviewHashStateState>(obj)
//   }

//   public render(): React.ReactElement<IPortfolioOverviewProps> {
//     if (this.state.error) {
//       return (
//         <div className={styles.root}>
//           <div className={styles.container}>
//             <MessageBar messageBarType={this.state.error.type}>
//               {this.state.error.message}
//             </MessageBar>
//           </div>
//         </div>
//       )
//     }

//     const { items, columns, groups } = this._getFilteredData()

//     return (
//       <div className={styles.root}>
//         <PortfolioOverviewCommands
//           {...{ ...this.props, ...this.state }}
//           fltItems={items}
//           fltColumns={columns}
//           filters={this._getFilters()}
//           events={{
//             onSetCompact: (isCompact) => this.setState({ isCompact }),
//             onChangeView: this._onChangeView.bind(this),
//             onFilterChange: this._onFilterChange.bind(this)
//           }}
//           layerHostId={this._layerHostId}
//           hidden={!this.props.showCommandBar}
//         />
//         <div className={styles.container}>
//           <ScrollablePane
//             scrollbarVisibility={ScrollbarVisibility.auto}
//             styles={{ root: { top: 75 } }}>
//             <MarqueeSelection selection={this._selection} className={styles.listContainer}>
//               <ShimmeredDetailsList
//                 enableShimmer={this.state.loading || !!this.state.isChangingView}
//                 items={items}
//                 constrainMode={ConstrainMode.unconstrained}
//                 layoutMode={DetailsListLayoutMode.fixedColumns}
//                 columns={columns}
//                 groups={groups}
//                 selectionMode={SelectionMode.multiple}
//                 selection={this._selection}
//                 setKey='multiple'
//                 onRenderDetailsHeader={this._onRenderDetailsHeader.bind(this)}
//                 onRenderItemColumn={(item, _index, column: ProjectColumn) =>
//                   renderItemColumn(item, column, this.props)
//                 }
//                 onColumnHeaderClick={this._onColumnHeaderClick.bind(this)}
//                 onColumnHeaderContextMenu={this._onColumnHeaderContextMenu.bind(this)}
//                 compact={this.state.isCompact}
//               />
//             </MarqueeSelection>
//             <LayerHost id={this._layerHostId} />
//           </ScrollablePane>
//         </div>
//         {this.state.columnContextMenu && <ContextualMenu {...this.state.columnContextMenu} />}
//       </div>
//     )
//   }

//   private get _searchBoxPlaceholderText() {
//     if (!this.state.currentView) return ''
//     return format(strings.SearchBoxPlaceholderText, this.state.currentView.title.toLowerCase())
//   }

//   /**
//    * On search
//    *
//    * @param _event Event
//    * @param searchTerm Search term
//    * @param delay Delay in ms
//    */
//   private _onSearch(
//     _event: React.ChangeEvent<HTMLInputElement>,
//     searchTerm: string,
//     delay: number = 600
//   ) {
//     clearTimeout(this._onSearchDelay)
//     this._onSearchDelay = setTimeout(() => {
//       this.setState({ searchTerm: searchTerm.toLowerCase() })
//     }, delay)
//   }

//   /**
//    * Get filters
//    */
//   private _getFilters(): IFilterProps[] {
//     if (!this.state.currentView) return []
//     const selectedFilters = this.props.configuration.refiners.filter(
//       (ref) => this.state.currentView.refiners.indexOf(ref) !== -1
//     )
//     const filters = selectedFilters.map((column) => {
//       const uniqueValues = uniq(
//         // eslint-disable-next-line prefer-spread
//         [].concat.apply(
//           [],
//           this.state.items.map((i) => get(i, column.fieldName, '').split(';'))
//         )
//       )
//       let items: IFilterItemProps[] = uniqueValues
//         .filter((value: string) => !stringIsNullOrEmpty(value))
//         .map((value: string) => ({ name: value, value }))
//       items = items.sort((a, b) => (a.value > b.value ? 1 : -1))
//       return { column, items }
//     })

//     const activeFilters = this.state.activeFilters
//     if (!_.isEmpty(activeFilters)) {
//       const filteredFields = Object.keys(activeFilters)
//       filteredFields.forEach((key) => {
//         filters.forEach((filter) => {
//           if (filter.column.fieldName === key) {
//             activeFilters[key].forEach((value) => {
//               filter.items.forEach((item) => {
//                 if (value === item.name) {
//                   item.selected = true
//                 }
//               })
//             })
//           }
//         })
//       })
//     }

//     return filters
//   }

//   /**
//    * On column sort
//    *
//    * @param column The column config
//    * @param sortDesencing Sort descending
//    */
//   private _onColumnSort(column: ProjectColumn, sortDesencing: boolean): void {
//     const { items, columns } = { ...this.state } as IPortfolioOverviewState
//     const itemsSorted = sortArray(items, [column.fieldName], { reverse: !sortDesencing })
//     this.setState({
//       sortBy: column,
//       items: itemsSorted,
//       columns: columns.map((col) => {
//         col.isSorted = col.key === column.key
//         if (col.isSorted) {
//           col.isSortedDescending = sortDesencing
//         }
//         return col
//       })
//     })
//   }

//   /**
//    * On column group by
//    *
//    * @param column The column config
//    */
//   private _onColumnGroupBy(column: ProjectColumn) {
//     this.setState((prevState) => ({
//       groupBy: get<string>(prevState, 'groupBy.fieldName', '') === column.fieldName ? null : column
//     }))
//   }

//   /**
//    * On render details header
//    *
//    * @param props Props
//    * @param defaultRender Default render
//    */
//   private _onRenderDetailsHeader(
//     props: IDetailsHeaderProps,
//     defaultRender?: IRenderFunction<IDetailsHeaderProps>
//   ) {
//     return (
//       <Sticky
//         stickyClassName={styles.stickyHeader}
//         stickyPosition={StickyPositionType.Header}
//         isScrollSynced={true}>
//         <div className={styles.header}>
//           <div className={styles.title}>{this.props.title}</div>
//         </div>
//         <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
//           <SearchBox
//             onChange={this._onSearch.bind(this)}
//             placeholder={this._searchBoxPlaceholderText}
//           />
//         </div>
//         <div className={styles.headerColumns}>{defaultRender(props)}</div>
//       </Sticky>
//     )
//   }

//   /**
//    * On column header click
//    *
//    * @param ev Event
//    * @param column Column
//    */
//   private _onColumnHeaderClick(
//     ev?: React.MouseEvent<HTMLElement, MouseEvent>,
//     column?: ProjectColumn
//   ) {
//     this._onColumnHeaderContextMenu(column, ev)
//   }

//   /**
//    * On column header context menu
//    *
//    * @param column Column
//    * @param ev Event
//    */
//   private _onColumnHeaderContextMenu(
//     column?: ProjectColumn,
//     ev?: React.MouseEvent<HTMLElement, MouseEvent>
//   ) {
//     if (column.key === 'AddColumn') return
//     this.setState({
//       columnContextMenu: {
//         target: ev.currentTarget,
//         items: [
//           {
//             key: 'SORT_DESC',
//             name: strings.SortDescLabel,
//             canCheck: true,
//             checked: column.isSorted && column.isSortedDescending,
//             onClick: () => this._onColumnSort(column, true)
//           },
//           {
//             key: 'SORT_ASC',
//             name: strings.SortAscLabel,
//             canCheck: true,
//             checked: column.isSorted && !column.isSortedDescending,
//             onClick: () => this._onColumnSort(column, false)
//           },
//           {
//             key: 'DIVIDER_01',
//             itemType: ContextualMenuItemType.Divider
//           },
//           {
//             key: 'FILTER_BY',
//             name: strings.FilterBy,
//             canCheck: true,
//             checked: false,
//             disabled: true
//           },
//           {
//             key: 'DIVIDER_02',
//             itemType: ContextualMenuItemType.Divider
//           },
//           {
//             key: 'GROUP_BY',
//             name: format(strings.GroupByColumnLabel, column.name),
//             canCheck: true,
//             checked: get<string>(this.state, 'groupBy.fieldName', '') === column.fieldName,
//             disabled: !column.isGroupable,
//             onClick: () => this._onColumnGroupBy(column)
//           },
//           {
//             key: 'DIVIDER_03',
//             itemType: ContextualMenuItemType.Divider
//           },
//           {
//             key: 'COLUMN_SETTINGS',
//             name: strings.ColumSettingsLabel,
//             onClick: () =>
//               redirect(`${this.props.configuration.columnUrls.defaultEditFormUrl}?ID=${column.id}`),
//             disabled: !this.props.pageContext.legacyPageContext.isSiteAdmin
//           }
//         ],
//         onDismiss: () => this.setState({ columnContextMenu: null })
//       } as IContextualMenuProps
//     })
//   }
// }
