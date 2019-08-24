import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import { getId } from '@uifabric/utilities';
import * as arraySort from 'array-sort';
import { IFetchDataForViewRefinersResult } from 'data/IFetchDataForViewResult';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { ContextualMenu, ContextualMenuItemType, IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, ConstrainMode, DetailsListLayoutMode, IGroup, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { LayerHost } from 'office-ui-fabric-react/lib/Layer';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'PortfolioWebPartsStrings';
import { ProjectInformationModal } from 'projectwebparts/lib/components/ProjectInformation';
import * as React from 'react';
import { getObjectValue } from 'shared/lib/helpers/getObjectValue';
import { parseUrlHash, redirect, setUrlHash } from 'shared/lib/util';
import * as format from 'string-format';
import { AggregatedSearchList, IFilterItemProps, IFilterProps } from '../';
import { IPortfolioOverviewProps } from './IPortfolioOverviewProps';
import { IPortfolioOverviewHashStateState, IPortfolioOverviewState } from './IPortfolioOverviewState';
import styles from './PortfolioOverview.module.scss';
import { PortfolioOverviewCommands } from './PortfolioOverviewCommands';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';
import { renderItemColumn } from './RenderItemColumn';
import * as _ from 'underscore';

export default class PortfolioOverview extends React.Component<IPortfolioOverviewProps, IPortfolioOverviewState> {
  public static defaultProps: Partial<IPortfolioOverviewProps> = {};
  private _onSearchDelay: number;
  private _layerHostId = getId('layerHost');

  constructor(props: IPortfolioOverviewProps) {
    super(props);
    this.state = {
      isLoading: true,
      isCompact: false,
      searchTerm: '',
      activeFilters: {},
      columns: [],
    };
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchInitialData();
      this.setState({ ...data, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public componentWillUpdate(_nextProps: IPortfolioOverviewProps, { currentView, groupBy }: IPortfolioOverviewState) {
    let obj: IPortfolioOverviewHashStateState = {};
    if (currentView) {
      obj.viewId = currentView.id.toString();
    }
    if (groupBy) {
      obj.groupBy = groupBy.fieldName;
    }
    setUrlHash<IPortfolioOverviewHashStateState>(obj);
  }

  public render(): React.ReactElement<IPortfolioOverviewProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.portfolioOverview}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, this.props.title)} size={SpinnerSize.large} />
          </div>
        </div>
      );
    }
    if (this.state.error) {
      return (
        <div className={styles.portfolioOverview}>
          <div className={styles.container}>
            <MessageBar messageBarType={this.state.error.type}>{this.state.error.message}</MessageBar>
          </div>
        </div>
      );
    }

    const { items, columns, groups } = this._getData();

    return (
      <div className={styles.portfolioOverview}>
        <PortfolioOverviewCommands
          {...this.props}
          {...this.state}
          fltItems={items}
          fltColumns={columns}
          events={{
            onSetCompact: isCompact => this.setState({ isCompact }),
            onChangeView: this._onChangeView.bind(this),
            onFilterChange: this._onFilterChange.bind(this),
          }}
          layerHostId={this._layerHostId}
          hidden={!this.props.showCommandBar} />
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
            <SearchBox onChange={this._onSearch.bind(this)} placeholder={this._searchBoxPlaceholderText} />
          </div>
          {this._list(items, columns, groups)}
          <LayerHost id={this._layerHostId} />
        </div>
        {this.state.showProjectInfo && (
          <ProjectInformationModal
            modalProps={{ isOpen: true, onDismiss: this._onDismissProjectInfoModal.bind(this) }}
            title={this.state.showProjectInfo.Title}
            siteId={this.state.showProjectInfo.SiteId}
            entity={this.props.entity}
            webUrl={this.props.pageContext.site.absoluteUrl}
            hubSiteUrl={this.props.pageContext.site.absoluteUrl}
            filterField={this.props.projectInfoFilterField}
            statusReportsListName={this.props.statusReportsListName}
            statusReportsCount={this.props.statusReportsCount}
            statusReportsLinkUrlTemplate={this.props.statusReportsLinkUrlTemplate} />
        )}
      </div>
    );
  }

  private get _searchBoxPlaceholderText() {
    return format(strings.SearchBoxPlaceholderText, this.state.currentView.title.toLowerCase());
  }

  private _list(items: any[], columns: PortfolioOverviewColumn[], groups: IGroup[]) {
    let columnsCopy = [...columns];
    if (this.props.pageContext.legacyPageContext.isSiteAdmin) {
      columnsCopy.push({
        key: 'AddColumn',
        fieldName: undefined,
        name: `  ${strings.AddColumnLabel}`,
        iconName: 'CalculatorAddition',
        onColumnClick: () => redirect(this.props.configuration.colNewFormUrl),
        minWidth: 150,
      } as PortfolioOverviewColumn);
    }

    return (
      <div className={styles.listContainer}>
        <DetailsList
          items={items}
          constrainMode={ConstrainMode.unconstrained}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          columns={columnsCopy}
          groups={groups}
          selectionMode={SelectionMode.none}
          onRenderItemColumn={(item, _index, column: PortfolioOverviewColumn) => renderItemColumn(item, column, state => this.setState(state))}
          onColumnHeaderClick={this._onColumnHeaderClick.bind(this)}
          onColumnHeaderContextMenu={this._onColumnHeaderContextMenu.bind(this)}
          compact={this.state.isCompact} />
        {this.state.columnContextMenu && <ContextualMenu {...this.state.columnContextMenu} />}
      </div>
    );
  }

  /**
   * On search
   * 
   * @param {string} searchTerm Search term
   * @param {number} delay Delay in ms
   */
  private _onSearch(searchTerm: string, delay: number = 500) {
    clearTimeout(this._onSearchDelay);
    this._onSearchDelay = setTimeout(() => {
      this.setState({ searchTerm: searchTerm.toLowerCase() });
    }, delay);
  }

  /**
  * Get filters
  *
  * @param {IFetchDataForViewRefinersResult} refiners Refiners retrieved by search
  * @param {IPortfolioOverviewConfigViewConfig} viewConfig View configuration
  */
  private _getFilters(refiners: IFetchDataForViewRefinersResult, viewConfig: PortfolioOverviewView): IFilterProps[] {
    const selectedRefiners = this.props.configuration.refiners.filter(ref => refiners[ref.fieldName] && viewConfig.refiners.indexOf(ref) !== -1);
    let filters = selectedRefiners.map(ref => {
      let items = refiners[ref.fieldName].sort((a, b) => a.value > b.value ? 1 : -1);
      return { column: ref, items };
    });
    return filters;
  }

  /**
   * On filter change 
   *
   * @param {PortfolioOverviewColumn} column Column
   * @param {IFilterItemProps[]} selectedItems Selected items
   */
  private _onFilterChange(column: PortfolioOverviewColumn, selectedItems: IFilterItemProps[]) {
    const { activeFilters } = ({ ...this.state } as IPortfolioOverviewState);
    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map(i => i.value);
    } else {
      delete activeFilters[column.fieldName];
    }
    this.setState({ activeFilters });
  }

  /**
   * On column sort
   *
   * @param {PortfolioOverviewColumn} column The column config
   * @param {boolean} sortDesencing Sort descending
   */
  private _onColumnSort(column: PortfolioOverviewColumn, sortDesencing: boolean): void {
    let { items, columns } = ({ ...this.state } as IPortfolioOverviewState);
    items = arraySort(items, [column.fieldName], { reverse: !sortDesencing });
    this.setState({
      sortBy: column,
      items,
      columns: columns.map(col => {
        col.isSorted = (col.key === column.key);
        if (col.isSorted) {
          col.isSortedDescending = sortDesencing;
        }
        return col;
      }),
    });
  }

  /**
   * On column group by
   * 
   * @param {PortfolioOverviewColumn} column The column config
   */
  private _onColumnGroupBy(column: PortfolioOverviewColumn) {
    this.setState(prevState => ({
      groupBy: getObjectValue<string>(prevState, 'groupBy.fieldName', '') === column.fieldName ? null : column,
    }));
  }

  /**
   * On column header click
   * 
   * @param {React.MouseEvent<HTMLElement, MouseEvent>} ev Event
   * @param {PortfolioOverviewColumn} column Column
   */
  private _onColumnHeaderClick(ev?: React.MouseEvent<HTMLElement, MouseEvent>, column?: PortfolioOverviewColumn) {
    this._onColumnHeaderContextMenu(column, ev);
  }

  /**
   * On column header context menu
   * 
   * @param {PortfolioOverviewColumn} column Column
   * @param {React.MouseEvent<HTMLElement, MouseEvent>} ev Event
   */
  private _onColumnHeaderContextMenu(column?: PortfolioOverviewColumn, ev?: React.MouseEvent<HTMLElement, MouseEvent>) {
    if (column.key === 'AddColumn') return;
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
            onClick: () => this._onColumnSort(column, true),
          },
          {
            id: getId('SortAsc'),
            key: getId('SortAsc'),
            name: strings.SortAscLabel,
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => this._onColumnSort(column, false),
          },
          {
            id: getId('Divider'),
            key: getId('Divider'),
            itemType: ContextualMenuItemType.Divider,
          },
          {
            id: getId('FilterBy'),
            key: getId('FilterBy'),
            name: strings.FilterBy,
            canCheck: true,
            checked: false,
            disabled: true,
            onClick: () => { },
          },
          {
            id: getId('Divider'),
            key: getId('Divider'),
            itemType: ContextualMenuItemType.Divider,
          },
          {
            id: getId('GroupBy'),
            key: getId('GroupBy'),
            name: format(strings.GroupByColumnLabel, column.name),
            canCheck: true,
            checked: getObjectValue<string>(this.state, 'groupBy.fieldName', '') === column.fieldName,
            disabled: !column.isGroupable,
            onClick: () => this._onColumnGroupBy(column),
          },
          {
            id: getId('Divider'),
            key: getId('Divider'),
            itemType: ContextualMenuItemType.Divider,
          },
          {
            id: getId('ColumSettings'),
            key: getId('ColumSettings'),
            name: strings.ColumSettingsLabel,
            onClick: () => redirect(`${this.props.configuration.colEditFormUrl}?ID=${column.id}`),
            disabled: !this.props.pageContext.legacyPageContext.isSiteAdmin,
          }
        ],
        onDismiss: () => this.setState({ columnContextMenu: null })
      } as IContextualMenuProps,
    });
  }

  /**
   * On dismiss <ProjectInformationModal />
   */
  private _onDismissProjectInfoModal() {
    this.setState({ showProjectInfo: null });
  }


  /**
   * Get filtered data
   */
  private _getData() {
    const { items, columns, searchTerm, groupBy, sortBy, activeFilters } = ({ ...this.state } as IPortfolioOverviewState);

    let filteredColumns = columns;
    let newItems = [...items].filter(item => {
      return columns.filter(col => getObjectValue(item, col.fieldName, '').toLowerCase().indexOf(searchTerm) !== -1).length > 0;
    });

    newItems = Object.keys(activeFilters)
      .filter(key => key !== 'SelectedColumns')
      .reduce((arr, key) => {
        return arr.filter(i => {
          let colValue = getObjectValue<string>(i, key, '');
          return activeFilters[key].filter(filterValue => colValue.indexOf(filterValue) !== -1).length > 0;
        });
      }, newItems);
    if (activeFilters.SelectedColumns) {
      filteredColumns = this.props.configuration.columns.filter(col => activeFilters.SelectedColumns.indexOf(col.fieldName) !== -1);
    }

    return { items: newItems, columns: filteredColumns, groups: AggregatedSearchList.getGroups(newItems, groupBy, sortBy) };
  }

  /**
   * Get current view
   * 
   * @param {IPortfolioOverviewHashStateState} hashState Hash state
   */
  private _getCurrentView(hashState: IPortfolioOverviewHashStateState): PortfolioOverviewView {
    const viewIdUrlParam = new UrlQueryParameterCollection(document.location.href).getValue('viewId');
    let { configuration, defaultViewId } = this.props;
    let { views } = configuration;
    let currentView = null;

    if (viewIdUrlParam) {
      currentView = _.find(views, v => v.id.toString() === viewIdUrlParam);
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error);
      }
    } else if (hashState.viewId) {
      currentView = _.find(views, v => v.id.toString() === hashState.viewId);
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error);
      }
    } else if (defaultViewId) {
      currentView = _.find(views, v => v.id.toString() === defaultViewId);
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error);
      }
    } else {
      currentView = _.find(views, v => v.isDefaultView);
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.NoDefaultViewMessage, MessageBarType.error);
      }
    }
    return currentView;
  }

  /**
  * Fetch initial data
  */
  private async _fetchInitialData(): Promise<Partial<IPortfolioOverviewState>> {
    try {
      const { configuration, pageContext } = this.props;
      const hashState = parseUrlHash<IPortfolioOverviewHashStateState>();
      const currentView = this._getCurrentView(hashState);
      const { items, refiners } = await this.props.dataAdapter.fetchDataForView(currentView, configuration, pageContext.site.id.toString());
      let filters = this._getFilters(refiners, currentView);
      let newState: Partial<IPortfolioOverviewState> = {
        columns: currentView.columns,
        items,
        filters,
        currentView,
        groupBy: currentView.groupBy,
      };
      if (hashState.groupBy && !newState.groupBy) {
        newState.groupBy = _.find(configuration.columns, fc => fc.fieldName === hashState.groupBy);
      }
      return newState;
    } catch (error) {
      throw error;
    }
  }


  /**
  * Changes view, doing a new search
  *
  * @param {PortfolioOverviewView} view View configuration
  */
  private async _onChangeView(view: PortfolioOverviewView) {
    if (this.state.currentView.id === view.id) {
      return;
    }
    this.setState({ isChangingView: view });
    let { configuration, pageContext } = this.props;
    const { items, refiners } = await this.props.dataAdapter.fetchDataForView(view, configuration, pageContext.site.id.toString());
    let filters = this._getFilters(refiners, view);
    let updatedState: Partial<IPortfolioOverviewState> = {
      isChangingView: null,
      items,
      filters,
      currentView: view,
      columns: view.columns,
      groupBy: view.groupBy,
    };

    this.setState(updatedState);
  }
}

export { IPortfolioOverviewProps };

