import * as React from 'react';
import styles from './PortfolioOverview.module.scss';
import * as strings from 'PortfolioOverviewWebPartStrings';
import { SearchResult } from '@pnp/sp';
import { IPortfolioOverviewProps, PortfolioOverviewDefaultProps } from './IPortfolioOverviewProps';
import { IPortfolioOverviewState } from './IPortfolioOverviewState';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { DetailsList, IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as PortfolioOverviewConfig from '../config';
import { fetchData, IRefinementResult } from '../data';
import PortfolioOverviewFieldSelector from './PortfolioOverviewFieldSelector';
import { PortfolioOverviewView, PortfolioOverviewColumn, IPortfolioOverviewConfiguration } from '../config';
import formatDate from 'prosjektportalen-spfx-shared/lib/helpers/formatDate';
import tryParseCurrency from 'prosjektportalen-spfx-shared/lib/helpers/tryParseCurrency';
import FilterPanel, { IFilterProps, IFilterItemProps } from '../../../components/FilterPanel';
import * as arraySort from 'array-sort';
import * as arrayUnique from 'array-unique';
import * as objectGet from 'object-get';

export default class PortfolioOverview extends React.Component<IPortfolioOverviewProps, IPortfolioOverviewState> {
  public static defaultProps: Partial<IPortfolioOverviewProps> = PortfolioOverviewDefaultProps;

  constructor(props: IPortfolioOverviewProps) {
    super(props);
    this.state = { isLoading: true, searchTerm: '', activeFilters: {} };
  }

  public async componentDidMount() {
    try {
      const data = await this.fetchInitialData();
      this.setState({ ...data, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IPortfolioOverviewProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.portfolioOverview}>
          <div className={styles.container}>
            <Spinner label={strings.LoadingText} size={SpinnerSize.large} />
          </div>
        </div>
      );
    }
    return (
      <div className={styles.portfolioOverview}>
        <div className={styles.container}>
          {this.renderCommandBar()}
          {this.renderTitle()}
          {this.renderSearchBox()}
          {this.renderList()}
          {this.renderFilterPanel()}
        </div>
      </div>
    );
  }

  /**
    * Renders the command bar from office-ui-fabric-react
    */
  private renderCommandBar() {
    const items: IContextualMenuItem[] = [];
    const farItems: IContextualMenuItem[] = [];

    if (this.props.showGroupBy) {
      const groupByItems = this.state.configuration.columns
        .filter(col => col.isGroupable)
        .map((col, idx) => ({
          key: `GroupByCol_${idx.toString()}`,
          name: col.name,
          onClick: (event: any) => {
            event.preventDefault();
            this.setState({ groupBy: col });
          },
        }));
      items.push({
        key: 'GroupBy',
        name: this.state.groupBy ? this.state.groupBy.name : strings.NoGrouping,
        iconProps: { iconName: 'GroupedList' },
        itemType: ContextualMenuItemType.Header,
        onClick: e => e.preventDefault(),
        subMenuProps: {
          items: [
            {
              key: 'GroupBy_NoGrouping',
              name: strings.NoGrouping,
              onClick: e => {
                e.preventDefault();
                this.setState({ groupBy: null });
              },
            },
            ...groupByItems,
          ],
        },
      });
    }

    if (this.props.viewSelectorEnabled) {
      farItems.push({
        key: 'View',
        name: this.state.currentView.title,
        iconProps: { iconName: 'List' },
        itemType: ContextualMenuItemType.Header,
        onClick: e => e.preventDefault(),
        subMenuProps: {
          items: this.state.configuration.views.map(v => ({
            key: `View_${v.id}`,
            name: v.title,
            iconProps: { iconName: v.iconName },
            onClick: (event: any) => {
              event.preventDefault();
              this.changeView(v);
            },
          })),
        },
      });
    }

    farItems.push({
      key: 'Filters',
      name: '',
      iconProps: { iconName: 'Filter' },
      itemType: ContextualMenuItemType.Normal,
      onClick: e => {
        e.preventDefault();
        this.setState({ showFilterPanel: true });
      },
    });

    return <CommandBar items={items} farItems={farItems} />;
  }

  /**
   *  Render SearchBox
   */
  private renderSearchBox() {
    return (
      <div className={styles.searchBox}>
        <SearchBox
          onChange={newValue => this.setState({ searchTerm: newValue.toLowerCase() })}
          placeholder={strings.SearchBoxPlaceHolder} />
      </div>
    );
  }

  /**
   *  Render title
   */
  private renderTitle() {
    return (
      <div className={styles.header}>
        <div className={styles.title}>{this.props.title}</div>
      </div>
    );
  }

  /**
   * Render list
   */
  private renderList() {
    if (this.state.error) {
      return (
        <div className={styles.portfolioOverview}>
          <div className={styles.container}>
            <MessageBar messageBarType={this.state.error.type}>{this.state.error.message}</MessageBar>
          </div>
        </div>
      );
    }

    const data = this.getFilteredData();

    return (
      <div className={styles.listContainer}>
        <DetailsList
          items={data.items}
          constrainMode={this.props.constrainMode}
          layoutMode={this.props.layoutMode}
          columns={data.columns}
          groups={data.groups}
          selectionMode={this.props.selectionMode}
          onRenderItemColumn={this.onRenderItemColumn}
          onColumnHeaderClick={this.onColumnSort} />
      </div>
    );
  }

  /**
   * Render filter panel
   */
  private renderFilterPanel() {
    PortfolioOverviewFieldSelector.items = this.state.configuration.columns.map(col => ({
      name: col.name,
      value: col.fieldName,
      selected: this.state.columns.indexOf(col) !== -1,
    }));
    return (
      <FilterPanel
        isOpen={this.state.showFilterPanel}
        onDismiss={() => this.setState({ showFilterPanel: false })}
        filters={[PortfolioOverviewFieldSelector, ...this.state.filters]}
        onFilterChange={this.onFilterChange} />
    );
  }

  /**
 * Get selected filters with items. Based on refiner configuration retrieved from the configuration list,
 * the filters are checked against refiners retrieved by search.
 *
 * @param {IRefinementResult[]} refiners Refiners retrieved by search
 * @param {IPortfolioOverviewConfig} configuration PortfolioOverviewConfig
 * @param {IPortfolioOverviewConfigViewConfig} viewConfig View configuration
 */
  private getSelectedFiltersWithItems(refiners: IRefinementResult[], configuration: IPortfolioOverviewConfiguration, viewConfig: PortfolioOverviewView): IFilterProps[] {
    return configuration.refiners
      .filter(ref => refiners.filter(r => r.Name === ref.key).length > 0 && viewConfig.refiners.indexOf(ref) !== -1)
      .map(ref => {
        let entries = refiners.filter(r => r.Name === ref.key)[0].Entries;
        let items = entries
          .map(entry => ({ name: entry.RefinementName, value: entry.RefinementValue }))
          .sort((a, b) => a.value > b.value ? 1 : -1);
        return { column: ref, items };
      });
  }

  /**
   * On filter change 
   *
   * @param {IColumn} column Column
   * @param {IFilterItemProps[]} selectedItems Selected items
   */
  @autobind
  private onFilterChange(column: IColumn, selectedItems: IFilterItemProps[]) {
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
   * @param {any} _event Event
   * @param {IColumn} column The column config
   */
  private onColumnSort(_event: any, column: IColumn): void {
    let { items, columns } = ({ ...this.state } as IPortfolioOverviewState);

    let isSortedDescending = column.isSortedDescending;
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }
    items = arraySort(items, [column.fieldName], { reverse: !isSortedDescending });
    this.setState({
      currentSort: { fieldName: column.fieldName, isSortedDescending: isSortedDescending },
      items,
      columns: columns.map(col => {
        col.isSorted = (col.key === column.key);
        if (col.isSorted) {
          col.isSortedDescending = isSortedDescending;
        }
        return col;
      }),
    });
  }

  /**
   * On render item activeFilters
  *
  * @param {SearchResult} item Item
  * @param {number} _index Index
  * @param {PortfolioOverviewColumn} column Column
  */
  @autobind
  private onRenderItemColumn(item: SearchResult, _index: number, column: PortfolioOverviewColumn) {
    const colValue = item[column.fieldName];
    switch (column.fieldName) {
      case 'Title': {
        return <a href={item.Path} target='_blank'>{colValue}</a>;
      }
    }
    switch (column.dataType) {
      case 'Date': {
        return formatDate(colValue);
      }
      case 'Currency': {
        return tryParseCurrency(colValue, '');
      }
      default: {
        return colValue;
      }
    }
  }


  /**
   * Get groups
   * 
   * @param {any[]} items Items
   * @param {PortfolioOverviewColumn}  groupBy Group by column
   * @param {Object} currentSort Current sort 
   */
  private getGroups(items: any[], groupBy: PortfolioOverviewColumn, currentSort: { fieldName: string; isSortedDescending: boolean; }): IGroup[] {
    let groups: IGroup[] = null;
    if (groupBy) {
      const itemsSort: any = { props: [groupBy.fieldName], opts: {} };
      if (currentSort) {
        itemsSort.props.push(currentSort.fieldName);
        itemsSort.opts.reverse = !currentSort.isSortedDescending;
      }
      const groupItems: any[] = arraySort(items, itemsSort.props, itemsSort.opts);
      const groupByValues: string[] = groupItems.map(g => g[groupBy.fieldName] ? g[groupBy.fieldName] : strings.NotSet);
      const uniqueGroupValues: string[] = arrayUnique([].concat(groupByValues));
      groups = uniqueGroupValues
        .sort((a, b) => a > b ? 1 : -1)
        .map((name, idx) => ({
          key: `Group_${idx}`,
          name: `${groupBy.name}: ${name}`,
          startIndex: groupByValues.indexOf(name, 0),
          count: [].concat(groupByValues).filter(n => n === name).length,
          isCollapsed: false,
          isShowingAll: true,
          isDropEnabled: false,
        }));
    }
    return groups;
  }

  /**
   * Get filtered data
   */
  private getFilteredData() {
    let { items, columns, searchTerm, groupBy, currentSort, activeFilters } = ({ ...this.state } as IPortfolioOverviewState);
    const activeFiltersKeys = Object.keys(activeFilters);

    let groups: IGroup[] = this.getGroups(items, groupBy, currentSort);
    items = [].concat(items).filter(item => {
      const fieldNames = columns.map(col => col.fieldName);
      return fieldNames.filter(fieldName => {
        return item[fieldName] && item[fieldName].toLowerCase().indexOf(searchTerm) !== -1;
      }).length > 0;
    });
    if (activeFiltersKeys.length > 0) {
      items = activeFiltersKeys
        .filter(key => key !== PortfolioOverviewFieldSelector.column.key)
        .reduce((_items, key) => _items.filter(i => activeFilters[key].indexOf(objectGet(i, key)) !== -1), items);
      const columnsFilter = activeFilters[PortfolioOverviewFieldSelector.column.key];
      if (columnsFilter) {
        columns = columns.filter(_column => columnsFilter.indexOf(_column.fieldName) !== -1);
      }
    }
    return { items, columns, groups };
  }

  /**
   * Fetch initial data
   */
  private async fetchInitialData(): Promise<Partial<IPortfolioOverviewState>> {
    let hashState: any = {};
    const configuration = await PortfolioOverviewConfig.getConfig();
    let currentView: PortfolioOverviewView;

    if (this.props.defaultView) {
      currentView = this.props.defaultView;
    } else {
      let viewIdUrlParam = '';
      if (viewIdUrlParam !== '') {
        [currentView] = configuration.views.filter(qc => qc.id === parseInt(viewIdUrlParam, 10));
        if (!currentView) {
          throw {
            message: strings.ViewNotFoundMessage,
            type: MessageBarType.error
          };
        }
      } else if (hashState.viewId) {
        [currentView] = configuration.views.filter(qc => qc.id === parseInt(hashState.viewId, 10));
        if (!currentView) {
          throw {
            message: strings.ViewNotFoundMessage,
            type: MessageBarType.error
          };
        }
      } else {
        [currentView] = configuration.views.filter(qc => qc.isDefaultView);
        if (!currentView) {
          throw {
            message: strings.NoDefaultViewMessage,
            type: MessageBarType.error
          };
        }
      }
    }
    const { items, refiners } = await fetchData(currentView, configuration, this.props.context);

    PortfolioOverviewFieldSelector.items = configuration.columns.map(col => ({
      name: col.name,
      value: col.fieldName,
      selected: currentView.columns.indexOf(col) !== -1,
    }));
    let filters = this.getSelectedFiltersWithItems(refiners, configuration, currentView);

    let updatedState: Partial<IPortfolioOverviewState> = {
      columns: currentView.columns,
      items,
      filters,
      currentView,
      configuration,
      canUserManageWeb: true,
    };

    if (currentView.groupBy) {
      let [groupByCol] = configuration.columns.filter(fc => fc.fieldName === currentView.groupBy.fieldName);
      if (groupByCol) {
        updatedState.groupBy = groupByCol;
      }
    }

    return updatedState;
  }


  /**
   * Changes view, doing a new search
   *
   * @param {PortfolioOverviewView} view View configuration
   */
  private async changeView(view: PortfolioOverviewView): Promise<void> {
    if (this.state.currentView.id === view.id) {
      return;
    }

    this.setState({ isChangingView: view });
    const { items, refiners } = await fetchData(view, this.state.configuration, this.props.context);
    let filters = this.getSelectedFiltersWithItems(refiners, this.state.configuration, view);

    let updatedState: Partial<IPortfolioOverviewState> = {
      isChangingView: null,
      items,
      filters: filters,
      currentView: view,
      columns: view.columns,
      groupBy: null,
    };

    if (view.groupBy) {
      let [groupByCol] = this.state.configuration.columns.filter(fc => fc.fieldName === view.groupBy.fieldName);
      if (groupByCol) {
        updatedState.groupBy = groupByCol;
      }
    }

    this.setState(updatedState);
  }
}
