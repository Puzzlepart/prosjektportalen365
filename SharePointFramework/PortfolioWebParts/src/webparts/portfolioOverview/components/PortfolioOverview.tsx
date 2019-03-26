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
import PortfolioOverviewFilterPanel from './PortfolioOverviewFilterPanel';
import PortfolioOverviewFieldSelector from './PortfolioOverviewFieldSelector';
import { PortfolioOverviewView, PortfolioOverviewColumn, IPortfolioOverviewConfiguration } from '../config';
import * as stringFormat from 'string-format';
import * as array_sort from 'array-sort';
import * as array_unique from 'array-unique';
import formatDate from 'prosjektportalen-spfx-shared/lib/helpers/formatDate';
import tryParseCurrency from 'prosjektportalen-spfx-shared/lib/helpers/tryParseCurrency';
import { IPortfolioOverviewFilter } from './PortfolioOverviewFilterPanel/PortfolioOverviewFilter';

export default class PortfolioOverview extends React.Component<IPortfolioOverviewProps, IPortfolioOverviewState> {
  public static defaultProps: Partial<IPortfolioOverviewProps> = PortfolioOverviewDefaultProps;

  constructor(props: IPortfolioOverviewProps) {
    super(props);
    this.state = { isLoading: true, searchTerm: '', currentFilters: {} };
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
          {this.renderStatusBar()}
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
  *  Render status bar
  */
  private renderStatusBar() {
    const data = this.getFilteredData();
    if (data.items.length === 0) {
      return null;
    }
    const { currentFilters } = this.state;
    const currentFiltersStr = [].concat.apply([], Object.keys(currentFilters).map(key => currentFilters[key])).join(', ');
    let statusText = stringFormat(strings.ShowCount, data.items.length.toString(), this.state.items.length.toString());
    if (currentFiltersStr) {
      statusText = stringFormat(strings.ShowCountWithFilters, data.items.length.toString(), this.state.items.length.toString(), currentFiltersStr);
    }
    return (
      <div className={styles.statusBar}>
        <MessageBar>{statusText}</MessageBar>
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
          onColumnHeaderClick={(_event, column) => this.onColumnSort(column)} />
      </div>
    );
  }

  /**
   * Render filter panel
   */
  private renderFilterPanel() {
    return (
      <PortfolioOverviewFilterPanel
        isOpen={this.state.showFilterPanel}
        onDismiss={() => this.setState({ showFilterPanel: false })}
        filters={this.state.filters}
        showIcons={false}
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
  private getSelectedFiltersWithItems(refiners: IRefinementResult[], configuration: IPortfolioOverviewConfiguration, viewConfig: PortfolioOverviewView): any {
    return configuration.refiners
      .filter(ref => refiners.filter(r => r.Name === ref.key).length > 0 && viewConfig.refiners.indexOf(ref) !== -1)
      .map(ref => {
        let entries = refiners.filter(r => r.Name === ref.key)[0].Entries;
        let items = entries
          .map(entry => ({
            name: entry.RefinementName,
            value: entry.RefinementValue,
          }))
          .sort((a, b) => a.value > b.value ? 1 : -1);
        return { ...ref, items };
      });
  }

  /**
    * Acts on filter change.
    *
    * @param {IDynamicPortfolioFilter} filter The filter that was changed
    */
  @autobind
  private onFilterChange(filter: IPortfolioOverviewFilter): void {
    const { items, currentFilters, filters } = this.state;

    let updatedFilterState: Partial<IPortfolioOverviewState> = {};

    switch (filter.key) {
      case "Fields": {
        updatedFilterState = {
          fieldNames: filter.selected,
          columns: this.state.configuration.columns.filter(field => filter.selected.indexOf(field.fieldName) !== -1),
          filters: filters.map(f => (f.key === filter.key) ? filter : f),
        };
      }
        break;
      default: {
        if (filter.selected.length > 0) {
          currentFilters[filter.key] = filter.selected;
        } else {
          if (currentFilters.hasOwnProperty(filter.key)) {
            delete currentFilters[filter.key];
          }
        }
        let filterKeys = Object.keys(currentFilters);
        let filteredItems = [];
        if (filterKeys.length > 0) {
          items.forEach(item => {
            let shouldInclude = true;
            filterKeys.forEach(filterKey => {
              let values = item[filterKey].split(";");
              if (values.length > 1) {
                let matches = values.filter((value: string) => currentFilters[filterKey].indexOf(value) !== -1);
                if (matches.length === 0) {
                  shouldInclude = false;
                }
              } else {
                if (currentFilters[filterKey].indexOf(values[0]) === -1) {
                  shouldInclude = false;
                }
              }
            });
            if (shouldInclude) {
              filteredItems.push(item);
            }
          });
        } else {
          filteredItems = items;
        }
        updatedFilterState = { currentFilters, filteredItems, filters: filters.map(f => (f.key === filter.key) ? filter : f) };
      }
    }

    this.setState(updatedFilterState);
  }

  /**
     * On column sort
     *
     * @param {IColumn} column The column config
     */
  private onColumnSort(column: IColumn): void {
    const { filteredItems, columns } = this.state;

    let isSortedDescending = column.isSortedDescending;
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }
    const items = array_sort(filteredItems, [column.fieldName], { reverse: !isSortedDescending });
    this.setState({
      currentSort: { fieldName: column.fieldName, isSortedDescending: isSortedDescending },
      filteredItems: items,
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
   * On render item column
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
   * Get filtered data
   */
  private getFilteredData() {
    let groups: IGroup[] = null;
    if (this.state.groupBy) {
      const itemsSort: any = { props: [this.state.groupBy.fieldName], opts: {} };
      if (this.state.currentSort) {
        itemsSort.props.push(this.state.currentSort.fieldName);
        itemsSort.opts.reverse = !this.state.currentSort.isSortedDescending;
      }
      const groupItems: any[] = array_sort(this.state.filteredItems, itemsSort.props, itemsSort.opts);
      const groupByValues: string[] = groupItems.map(g => g[this.state.groupBy.fieldName] ? g[this.state.groupBy.fieldName] : strings.NotSet);
      const uniqueGroupValues: string[] = array_unique([].concat(groupByValues));
      groups = uniqueGroupValues
        .sort((a, b) => a > b ? 1 : -1)
        .map((name, idx) => ({
          key: `Group_${idx}`,
          name: `${this.state.groupBy.name}: ${name}`,
          startIndex: groupByValues.indexOf(name, 0),
          count: [].concat(groupByValues).filter(n => n === name).length,
          isCollapsed: false,
          isShowingAll: true,
          isDropEnabled: false,
        }));
    }
    let items = [].concat(this.state.filteredItems).filter(item => {
      const fieldNames = this.state.columns.map(col => col.fieldName);
      return fieldNames.filter(fieldName => {
        return item[fieldName] && item[fieldName].toLowerCase().indexOf(this.state.searchTerm) !== -1;
      }).length > 0;
    });
    return { items, columns: this.state.columns, groups };
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
    const fieldNames = configuration.columns.map(f => f.fieldName);
    const { items, refiners } = await fetchData(currentView, configuration, this.props.context);

    PortfolioOverviewFieldSelector.items = configuration.columns.map(col => ({
      name: col.name,
      value: col.fieldName,
      selected: currentView.columns.indexOf(col) !== -1,
      readOnly: false,
    }));
    let filters = this.getSelectedFiltersWithItems(refiners, configuration, currentView).concat([PortfolioOverviewFieldSelector]);

    let updatedState: Partial<IPortfolioOverviewState> = {
      columns: currentView.columns,
      fieldNames,
      items,
      filteredItems: items,
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
    PortfolioOverviewFieldSelector.items = this.state.configuration.columns.map(col => ({
      name: col.name,
      value: col.fieldName,
      selected: view.columns.indexOf(col) !== -1,
      readOnly: false,
    }));

    let filters = this.getSelectedFiltersWithItems(refiners, this.state.configuration, view).concat([PortfolioOverviewFieldSelector]);

    let updatedState: Partial<IPortfolioOverviewState> = {
      isChangingView: null,
      items,
      filteredItems: items,
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
