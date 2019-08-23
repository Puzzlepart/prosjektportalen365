import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import * as arraySort from 'array-sort';
import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { ContextualMenu, ContextualMenuItemType, IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, IColumn, IGroup, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
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
import { IPortfolioOverviewProps, PortfolioOverviewDefaultProps } from './IPortfolioOverviewProps';
import { IPortfolioOverviewHashStateState, IPortfolioOverviewState } from './IPortfolioOverviewState';
import styles from './PortfolioOverview.module.scss';
import { PortfolioOverviewCommands } from './PortfolioOverviewCommands';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';

import { renderItemColumn } from './RenderItemColumn';

export default class PortfolioOverview extends React.Component<IPortfolioOverviewProps, IPortfolioOverviewState> {
  public static defaultProps: Partial<IPortfolioOverviewProps> = PortfolioOverviewDefaultProps;
  private _onSearchDelay: number;

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
      const data = await this.fetchInitialData();
      this.setState({ ...data, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public componentWillUpdate(_: IPortfolioOverviewProps, { currentView, groupBy, columns }: IPortfolioOverviewState) {
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

    const { items, columns, groups } = this.getData();

    return (
      <div className={styles.portfolioOverview}>
        <div className={styles.container}>
          <PortfolioOverviewCommands
            {...this.props}
            {...this.state}
            fltItems={items}
            fltColumns={columns}
            onGroupBy={groupBy => this.setState({ groupBy })}
            onSetCompact={isCompact => this.setState({ isCompact })}
            onChangeView={this.onChangeView.bind(this)}
            onFilterChange={this.onFilterChange.bind(this)} />
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
            <SearchBox onChange={this.onSearch.bind(this)} placeholder={this.searchBoxPlaceholder} />
          </div>
          {this.list(items, columns, groups)}
          {this.state.showProjectInfo && (
            <ProjectInformationModal
              modalProps={{ isOpen: true, onDismiss: this.onDismissProjectInfoModal.bind(this) }}
              title={this.state.showProjectInfo.Title}
              siteId={this.state.showProjectInfo['SiteId']}
              entity={this.props.entity}
              webUrl={this.props.pageContext.site.absoluteUrl}
              hubSiteUrl={this.props.pageContext.site.absoluteUrl}
              filterField={this.props.projectInfoFilterField}
              statusReportsListName={this.props.statusReportsListName}
              statusReportsCount={this.props.statusReportsCount}
              statusReportsLinkUrlTemplate={this.props.statusReportsLinkUrlTemplate} />
          )}
        </div>
      </div>
    );
  }

  private get searchBoxPlaceholder() {
    return format(strings.SearchBoxPlaceholderText, this.state.currentView.title.toLowerCase());
  }

  private list(items: any[], columns: PortfolioOverviewColumn[], groups: IGroup[]) {
    let addColumn: IColumn = null;
    if (this.props.pageContext.legacyPageContext.isSiteAdmin) {
      addColumn = {
        key: 'AddColumn',
        name: `  ${strings.AddColumnLabel}`,
        iconName: 'CalculatorAddition',
        onColumnClick: _ => redirect(this.props.configuration.colNewFormUrl),
        minWidth: 150,
      };
    }

    return (
      <div className={styles.listContainer}>
        <DetailsList
          items={items}
          constrainMode={this.props.constrainMode}
          layoutMode={this.props.layoutMode}
          columns={[...columns, addColumn]}
          groups={groups}
          selectionMode={SelectionMode.none}
          onRenderItemColumn={(item, _index, column: PortfolioOverviewColumn) => renderItemColumn(item, column, state => this.setState(state))}
          onColumnHeaderContextMenu={this.onColumnHeaderContextMenu.bind(this)}
          compact={this.state.isCompact} />
        {this.state.columnHeaderContextMenu && <ContextualMenu {...this.state.columnHeaderContextMenu} />}
      </div>
    );
  }

  /**
   * On search
   * 
   * @param {string} searchTerm Search term
   * @param {number} delay Delay in ms
   */
  private onSearch(searchTerm: string, delay: number = 500) {
    clearTimeout(this._onSearchDelay);
    this._onSearchDelay = setTimeout(() => {
      this.setState({ searchTerm: searchTerm.toLowerCase() });
    }, delay);
  }

  /**
  * Get filters
  *
  * @param {any[]} refiners Refiners retrieved by search
  * @param {IPortfolioOverviewConfigViewConfig} viewConfig View configuration
  */
  private getFilters(refiners: any[], viewConfig: PortfolioOverviewView): IFilterProps[] {
    const selectedRefiners = this.props.configuration.refiners.filter(ref => refiners.filter(r => r.Name === ref.key).length > 0 && viewConfig.refiners.indexOf(ref) !== -1);
    let filters = selectedRefiners.map(ref => {
      let entries: any[] = refiners.filter(r => r.Name === ref.key)[0].Entries;
      let items = entries.map(entry => ({ name: entry.RefinementName, value: entry.RefinementValue }));
      let itemsSorted = items.sort((a, b) => a.value > b.value ? 1 : -1);
      return { column: ref, items: itemsSorted };
    });
    return filters;
  }

  /**
   * On filter change 
   *
   * @param {PortfolioOverviewColumn} column Column
   * @param {IFilterItemProps[]} selectedItems Selected items
   */
  private onFilterChange(column: PortfolioOverviewColumn, selectedItems: IFilterItemProps[]) {
    const { activeFilters } = ({ ...this.state } as IPortfolioOverviewState);
    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map(i => i.value);
    } else {
      delete activeFilters[column.fieldName];
    }
    this.setState({ activeFilters });
  }

  /**
   * On column header click
   *
   * @param {PortfolioOverviewColumn} column The column config
   * @param {boolean} sortDesencing Sort descending
   */
  private onColumnSort(column: PortfolioOverviewColumn, sortDesencing: boolean): void {
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
   * On column header context menu
   * 
   * @param {PortfolioOverviewColumn} column Column
   * @param {React.MouseEvent<HTMLElement, MouseEvent>} ev Event
   */
  private onColumnHeaderContextMenu(column?: PortfolioOverviewColumn, ev?: React.MouseEvent<HTMLElement, MouseEvent>) {
    if (column.key === 'AddColumn') return;
    this.setState({
      columnHeaderContextMenu: {
        target: ev.currentTarget,
        items: [
          {
            key: 'SortDesc',
            name: strings.SortDescLabel,
            canCheck: true,
            checked: column.isSorted && column.isSortedDescending,
            onClick: _ => this.onColumnSort(column, true),
          },
          {
            key: 'SortAsc',
            name: strings.SortAscLabel,
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: _ => this.onColumnSort(column, false),
          },
          {
            key: 'divider_0',
            itemType: ContextualMenuItemType.Divider,
          },
          {
            key: 'ColumSettings',
            name: strings.ColumSettingsLabel,
            onClick: _ => redirect(`${this.props.configuration.colEditFormUrl}?ID=${column.id}`),
            disabled: !this.props.pageContext.legacyPageContext.isSiteAdmin,
          }
        ],
        onDismiss: _ => this.setState({ columnHeaderContextMenu: null })
      } as IContextualMenuProps,
    });
  }

  /**
   * On dismiss <ProjectInformationModal />
   */
  private onDismissProjectInfoModal() {
    this.setState({ showProjectInfo: null });
  }

  /**
   * Get filtered data
   */
  private getData() {
    const { items, columns, searchTerm, groupBy, sortBy, activeFilters } = ({ ...this.state } as IPortfolioOverviewState);

    let groups: IGroup[] = AggregatedSearchList.getGroups(items, groupBy, sortBy);

    let filteredColumns = columns;
    let filteredItems = [].concat(items).filter(item => {
      const fieldNames = columns.map(col => col.fieldName);
      return fieldNames.filter(fieldName => {
        return item[fieldName] && item[fieldName].toLowerCase().indexOf(searchTerm) !== -1;
      }).length > 0;
    });

    if (Object.keys(activeFilters).length > 0) {
      filteredItems = Object.keys(activeFilters)
        .filter(colKey => colKey !== 'SelectedColumns')
        .reduce((_items, colKey) => {
          return _items.filter(_item => {
            let colValue = getObjectValue<string>(_item, colKey, '');
            return activeFilters[colKey].filter(filterValue => colValue.indexOf(filterValue) !== -1).length > 0;
          });
        }, items);
      const selectedFilters = activeFilters.SelectedColumns;
      if (selectedFilters) {
        filteredColumns = this.props.configuration.columns.filter(_column => selectedFilters.indexOf(_column.fieldName) !== -1);
      }
    }

    return { items: filteredItems, columns: filteredColumns, groups };
  }

  /**
   * Get current view
   * 
   * @param {IPortfolioOverviewHashStateState} hashState Hash state
   */
  private getCurrentView(hashState: IPortfolioOverviewHashStateState): PortfolioOverviewView {
    const viewIdUrlParam = new UrlQueryParameterCollection(document.location.href).getValue('viewId');
    let currentView = this.props.defaultView;

    if (viewIdUrlParam) {
      [currentView] = this.props.configuration.views.filter(qc => qc.id === parseInt(viewIdUrlParam, 10));
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error);
      }
    } else if (hashState.viewId) {
      [currentView] = this.props.configuration.views.filter(qc => qc.id === parseInt(hashState.viewId, 10));
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error);
      }
    } else if (this.props.defaultViewId) {
      [currentView] = this.props.configuration.views.filter(qc => qc.id === parseInt(this.props.defaultViewId, 10));
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.ViewNotFoundMessage, MessageBarType.error);
      }
    } else {
      [currentView] = this.props.configuration.views.filter(qc => qc.isDefaultView);
      if (!currentView) {
        throw new PortfolioOverviewErrorMessage(strings.NoDefaultViewMessage, MessageBarType.error);
      }
    }
    return currentView;
  }

  /**
  * Fetch initial data
  */
  private async fetchInitialData(): Promise<Partial<IPortfolioOverviewState>> {
    try {
      const hashState = parseUrlHash<IPortfolioOverviewHashStateState>();
      const currentView = this.getCurrentView(hashState);
      const { items, refiners } = await this.props.dataAdapter.fetchDataForView(currentView, this.props.configuration, this.props.pageContext.site.id.toString());
      let filters = this.getFilters(refiners, currentView);
      let newState: Partial<IPortfolioOverviewState> = {
        columns: currentView.columns,
        items,
        filters,
        currentView,
        groupBy: currentView.groupBy,
      };
      if (hashState.groupBy && !newState.groupBy) {
        newState.groupBy = this.props.configuration.columns.filter(fc => fc.fieldName === hashState.groupBy)[0];
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
  private async onChangeView(view: PortfolioOverviewView) {
    if (this.state.currentView.id === view.id) {
      return;
    }
    this.setState({ isChangingView: view });
    const { items, refiners } = await this.props.dataAdapter.fetchDataForView(view, this.props.configuration, this.props.pageContext.site.id.toString());
    let filters = this.getFilters(refiners, view);
    let updatedState: Partial<IPortfolioOverviewState> = {
      isChangingView: null,
      items,
      filters: filters,
      currentView: view,
      columns: view.columns,
      groupBy: view.groupBy,
    };

    this.setState(updatedState);
  }
}

export { IPortfolioOverviewProps };

