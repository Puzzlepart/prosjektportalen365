import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import { SearchResult } from '@pnp/sp';
import { formatDate, tryParseCurrency } from '@Shared/helpers';
import { parseUrlHash, setUrlHash } from '@Shared/util';
import * as arraySort from 'array-sort';
import * as arrayUnique from 'array-unique';
import { fetchDataForView, getPortfolioConfig } from 'data';
import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import * as objectGet from 'object-get';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as PortfolioOverviewWebPartStrings from 'PortfolioOverviewWebPartStrings';
import { ProjectInformationModal } from 'ProjectWebParts/lib/components/ProjectInformation';
import * as React from 'react';
import { FilterPanel, IFilterItemProps, IFilterProps } from '../';
import { IPortfolioOverviewProps, PortfolioOverviewDefaultProps } from './IPortfolioOverviewProps';
import { IPortfolioOverviewState } from './IPortfolioOverviewState';
import styles from './PortfolioOverview.module.scss';
import { PortfolioOverviewFieldSelector } from './PortfolioOverviewFieldSelector';

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

  public componentWillUpdate(_nextProps: IPortfolioOverviewProps, { currentView, groupBy }: IPortfolioOverviewState) {
    let obj: { [key: string]: string } = {};
    if (currentView) {
      obj.viewId = currentView.id.toString();
    }
    if (groupBy) {
      obj.groupBy = groupBy.fieldName;
    }
    setUrlHash(obj);
  }

  public render(): React.ReactElement<IPortfolioOverviewProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.portfolioOverview}>
          <div className={styles.container}>
            <Spinner label={PortfolioOverviewWebPartStrings.LoadingText} size={SpinnerSize.large} />
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
    return (
      <div className={styles.portfolioOverview}>
        <div className={styles.container}>
          {this.commandBar}
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.searchBox}>
            <SearchBox
              onChange={newValue => this.setState({ searchTerm: newValue.toLowerCase() })}
              placeholder={PortfolioOverviewWebPartStrings.SearchBoxPlaceHolder} />
          </div>
          {this.list}
          {this.filterPanel}
          {this.projectInfoModal}
        </div>
      </div>
    );
  }

  private get commandBar() {
    const items: IContextualMenuItem[] = [];
    const farItems: IContextualMenuItem[] = [];

    if (this.props.showGroupBy) {
      const groupByItems = this.state.configuration.columns
        .filter(col => col.isGroupable)
        .map((col, idx) => ({
          key: `${idx}`,
          name: col.name,
          onClick: (event: any) => {
            event.preventDefault();
            this.setState({ groupBy: col });
          },
        }));
      items.push({
        key: 'GroupBy',
        name: this.state.groupBy ? this.state.groupBy.name : PortfolioOverviewWebPartStrings.NoGrouping,
        iconProps: { iconName: 'GroupedList' },
        itemType: ContextualMenuItemType.Header,
        onClick: e => e.preventDefault(),
        subMenuProps: {
          items: [
            {
              key: 'GroupBy_NoGrouping',
              name: PortfolioOverviewWebPartStrings.NoGrouping,
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
      if (this.props.pageContext.legacyPageContext.isSiteAdmin) {
        farItems.push({
          key: 'NewView',
          name: PortfolioOverviewWebPartStrings.NewViewText,
          iconProps: { iconName: 'CirclePlus' },
          href: `${this.state.configuration.viewNewFormUrl}?Source=${encodeURIComponent(document.location.href)}`,
        });
      }
      farItems.push({
        key: 'View',
        name: this.state.currentView.title,
        iconProps: { iconName: 'List' },
        itemType: ContextualMenuItemType.Header,
        subMenuProps: {
          items: this.state.configuration.views.map(v => ({
            key: `${v.id}`,
            name: v.title,
            iconProps: { iconName: v.iconName },
            onClick: (event: any) => {
              event.preventDefault();
              this.onChangeView(v);
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

  private get list() {
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
          onRenderItemColumn={this.onRenderItemColumn.bind(this)}
          onColumnHeaderClick={this.onColumnSort.bind(this)} />
      </div>
    );
  }

  private get filterPanel() {
    PortfolioOverviewFieldSelector.items = this.state.configuration.columns.map(col => ({
      name: col.name,
      value: col.fieldName,
      selected: this.state.columns.indexOf(col) !== -1,
    }));
    return (
      <FilterPanel
        isOpen={this.state.showFilterPanel}
        onDismiss={this.onDismissFilterPanel.bind(this)}
        filters={[PortfolioOverviewFieldSelector, ...this.state.filters]}
        onFilterChange={this.onFilterChange.bind(this)} />
    );
  }

  private get projectInfoModal() {
    if (!this.state.showProjectInfo) return null;
    return (
      <ProjectInformationModal
        modalProps={{ isOpen: true, onDismiss: this.onDismissProjectInfoModal.bind(this) }}
        title={this.state.showProjectInfo.Title}
        siteId={this.state.showProjectInfo['SiteId']}
        entity={this.props.entity}
        webUrl={this.props.pageContext.site.absoluteUrl}
        hubSiteUrl={this.props.pageContext.site.absoluteUrl}
        filterField={this.props.projectInfoFilterField} />
    );
  }

  /**
   * On dismiss <FilterPabel />
   */
  private onDismissFilterPanel() {
    this.setState({ showFilterPanel: false });
  }

  /**
 * Get selected filters with items. Based on refiner configuration retrieved from the configuration list,
 * the filters are checked against refiners retrieved by search.
 *
 * @param {any[]} refiners Refiners retrieved by search
 * @param {IPortfolioOverviewConfig} configuration PortfolioOverviewConfig
 * @param {IPortfolioOverviewConfigViewConfig} viewConfig View configuration
 */
  private getSelectedFiltersWithItems(refiners: any[], configuration: IPortfolioOverviewConfiguration, viewConfig: PortfolioOverviewView): IFilterProps[] {
    const selectedRefiners = configuration.refiners.filter(ref => refiners.filter(r => r.Name === ref.key).length > 0 && viewConfig.refiners.indexOf(ref) !== -1);
    let filters = selectedRefiners.map(ref => {
      let entries = refiners.filter(r => r.Name === ref.key)[0].Entries;
      let items = entries.map(entry => ({ name: entry.RefinementName, value: entry.RefinementValue }));
      let itemsSorted = items.sort((a, b) => a.value > b.value ? 1 : -1);
      return { column: ref, items: itemsSorted };
    });
    return filters;
  }

  /**
   * On filter change 
   *
   * @param {IColumn} column Column
   * @param {IFilterItemProps[]} selectedItems Selected items
   */
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
   * @param {React.MouseEvent<HTMLElement, MouseEvent>} _ev Event
   * @param {PortfolioOverviewColumn} column The column config
   */
  private onColumnSort(_ev: React.MouseEvent<HTMLElement, MouseEvent>, column: PortfolioOverviewColumn): void {
    let { items, columns } = ({ ...this.state } as IPortfolioOverviewState);

    let isSortedDescending = column.isSortedDescending;
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }
    items = arraySort(items, [column.fieldName], { reverse: !isSortedDescending });
    this.setState({
      sortBy: { ...column, isSortedDescending },
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
   * On open <ProjectInformationModal />
   * 
   * @param {SearchResult} item 
   */
  private onOpenProjectInfoModal(item: SearchResult) {
    this.setState({ showProjectInfo: item });
  }

  /**
   * On dismiss <ProjectInformationModal />
   */
  private onDismissProjectInfoModal() {
    this.setState({ showProjectInfo: null });
  }

  /**
   * On render item activeFilters
  *
  * @param {SearchResult} item Item
  * @param {number} _index Index
  * @param {PortfolioOverviewColumn} column Column
  */
  private onRenderItemColumn(item: SearchResult, _index: number, column: PortfolioOverviewColumn) {
    const colValue = item[column.fieldName];
    switch (column.fieldName) {
      case 'Title': {
        return (
          <span>
            <a href={item.Path} target='_blank'>{colValue}</a>
            <a href='#' style={{ marginLeft: 8 }} onClick={_evt => this.onOpenProjectInfoModal(item)}><Icon iconName='OpenInNewWindow' /></a>
          </span >
        );
      }
    }
    switch (column.dataType) {
      case 'Date': {
        return (
          <span>
            {formatDate(colValue)}
          </span>
        );
      }
      case 'Currency': {
        return (
          <span>
            {tryParseCurrency(colValue, '')}
          </span>
        );
      }
      default: {
        const config = column.config ? column.config[colValue] : null;
        if (config) {
          return (
            <span>
              <Icon iconName={config.iconName} style={{ color: config.color, marginRight: 4 }} />
              <span>{colValue}</span>
            </span>
          );
        }
        return (
          <span>
            {colValue}
          </span>
        );
      }
    }
  }

  /**
   * Get groups
   * 
   * @param {any[]} items Items
   * @param {PortfolioOverviewColumn}  groupBy Group by column
   * @param {PortfolioOverviewColumn} sortBy Sort by column
   */
  private getGroups(items: any[], groupBy: PortfolioOverviewColumn, sortBy: PortfolioOverviewColumn): IGroup[] {
    let groups: IGroup[] = null;
    if (groupBy) {
      const itemsSort: any = { props: [groupBy.fieldName], opts: {} };
      if (sortBy) {
        itemsSort.props.push(sortBy.fieldName);
        itemsSort.opts.reverse = !sortBy.isSortedDescending;
      }
      const groupItems: any[] = arraySort(items, itemsSort.props, itemsSort.opts);
      const groupByValues: string[] = groupItems.map(g => g[groupBy.fieldName] ? g[groupBy.fieldName] : PortfolioOverviewWebPartStrings.NotSet);
      const uniqueGroupValues: string[] = arrayUnique([].concat(groupByValues));
      groups = uniqueGroupValues
        .sort((a, b) => a > b ? 1 : -1)
        .map((name, idx) => ({
          key: `${idx}`,
          name: `${groupBy.name}: ${name}`,
          startIndex: groupByValues.indexOf(name, 0),
          count: [].concat(groupByValues).filter(n => n === name).length,
          isShowingAll: true,
        }));
    }
    return groups;
  }

  /**
   * Get filtered data
   */
  private getFilteredData() {
    let {
      items,
      columns,
      searchTerm,
      groupBy,
      sortBy,
      activeFilters,
      configuration,
    } = ({ ...this.state } as IPortfolioOverviewState);

    let groups: IGroup[] = this.getGroups(items, groupBy, sortBy);

    items = [].concat(items).filter(item => {
      const fieldNames = columns.map(col => col.fieldName);
      return fieldNames.filter(fieldName => {
        return item[fieldName] && item[fieldName].toLowerCase().indexOf(searchTerm) !== -1;
      }).length > 0;
    });

    if (Object.keys(activeFilters).length > 0) {
      items = Object.keys(activeFilters)
        .filter(key => key !== PortfolioOverviewFieldSelector.column.key)
        .reduce((_items, key) => _items.filter(i => activeFilters[key].indexOf(objectGet(i, key)) !== -1), items);
      const selectedFilters = activeFilters[PortfolioOverviewFieldSelector.column.key];
      if (selectedFilters) {
        columns = configuration.columns.filter(_column => selectedFilters.indexOf(_column.fieldName) !== -1);
      }
    }

    return { items, columns, groups };
  }

  /**
   * Fetch initial data
   */
  private async fetchInitialData(): Promise<Partial<IPortfolioOverviewState>> {
    try {
      const configuration = await getPortfolioConfig();
      const hashState = parseUrlHash();
      const viewIdUrlParam = new UrlQueryParameterCollection(document.location.href).getValue('viewId');
      let currentView = this.props.defaultView;

      if (viewIdUrlParam) {
        [currentView] = configuration.views.filter(qc => qc.id === parseInt(viewIdUrlParam, 10));
        if (!currentView) {
          throw {
            message: PortfolioOverviewWebPartStrings.ViewNotFoundMessage,
            type: MessageBarType.error
          };
        }
      } else if (hashState.viewId) {
        [currentView] = configuration.views.filter(qc => qc.id === parseInt(hashState.viewId, 10));
        if (!currentView) {
          throw {
            message: PortfolioOverviewWebPartStrings.ViewNotFoundMessage,
            type: MessageBarType.error
          };
        }
      } else {
        [currentView] = configuration.views.filter(qc => qc.isDefaultView);
        if (!currentView) {
          throw {
            message: PortfolioOverviewWebPartStrings.NoDefaultViewMessage,
            type: MessageBarType.error
          };
        }
      }

      const { items, refiners } = await fetchDataForView(currentView, configuration, this.props.pageContext.site.id.toString());

      PortfolioOverviewFieldSelector.items = configuration.columns.map(col => ({
        name: col.name,
        value: col.fieldName,
        selected: currentView.columns.indexOf(col) !== -1,
      }));
      let filters = this.getSelectedFiltersWithItems(refiners, configuration, currentView);
      let groupBy: PortfolioOverviewColumn;
      if (currentView.groupBy) {
        [groupBy] = configuration.columns.filter(fc => fc.fieldName === currentView.groupBy.fieldName);
      }
      if (hashState.groupBy) {
        [groupBy] = configuration.columns.filter(fc => fc.fieldName === hashState.groupBy);
      }

      let _state: Partial<IPortfolioOverviewState> = {
        columns: currentView.columns,
        items,
        filters,
        currentView,
        configuration,
        canUserManageWeb: true,
        groupBy,
      };

      return _state;
    } catch (error) {
      throw error;
    }
  }


  /**
   * Changes view, doing a new search
   *
   * @param {PortfolioOverviewView} view View configuration
   */
  private async onChangeView(view: PortfolioOverviewView): Promise<void> {
    if (this.state.currentView.id === view.id) {
      return;
    }

    this.setState({ isChangingView: view });
    const { items, refiners } = await fetchDataForView(view, this.state.configuration, this.props.pageContext.site.id.toString());
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

export { IPortfolioOverviewProps };

