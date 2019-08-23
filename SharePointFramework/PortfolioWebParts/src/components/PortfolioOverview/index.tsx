import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import * as arraySort from 'array-sort';
import * as arrayUnique from 'array-unique';
import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import * as objectGet from 'object-get';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, IColumn, IGroup, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'PortfolioWebPartsStrings';
import { ProjectInformationModal } from 'projectwebparts/lib/components/ProjectInformation';
import * as React from 'react';
import { ExcelExportService } from 'shared/lib/services';
import { parseUrlHash, setUrlHash } from 'shared/lib/util';
import * as format from 'string-format';
import { FilterPanel, IFilterItemProps, IFilterProps, AggregatedSearchList } from '../';
import { IPortfolioOverviewProps, PortfolioOverviewDefaultProps } from './IPortfolioOverviewProps';
import { IPortfolioOverviewHashStateState, IPortfolioOverviewState } from './IPortfolioOverviewState';
import styles from './PortfolioOverview.module.scss';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';
import { PortfolioOverviewFieldSelector } from './PortfolioOverviewFieldSelector';
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
    PortfolioOverviewFieldSelector.items = this.props.configuration.columns.map(col => ({
      name: col.name,
      value: col.fieldName,
      selected: columns.indexOf(col) !== -1,
    }));
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
    return (
      <div className={styles.portfolioOverview}>
        <div className={styles.container}>
          {this.commandBar()}
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
            <SearchBox onChange={this.onSearch.bind(this)} placeholder={this.searchBoxPlaceholder} />
          </div>
          {this.list()}
          <FilterPanel
            isOpen={this.state.showFilterPanel}
            onDismiss={this.onDismissFilterPanel.bind(this)}
            filters={[PortfolioOverviewFieldSelector, ...this.state.filters]}
            onFilterChange={this.onFilterChange.bind(this)} />
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

  private commandBar() {
    const items: IContextualMenuItem[] = [];
    const farItems: IContextualMenuItem[] = [];

    if (this.props.showGroupBy) {
      items.push({
        key: 'GroupBy',
        name: this.state.groupBy ? this.state.groupBy.name : strings.NoGroupingText,
        iconProps: { iconName: 'GroupedList' },
        itemType: ContextualMenuItemType.Header,
        subMenuProps: {
          items: [
            {
              key: 'NoGrouping',
              name: strings.NoGroupingText,
              onClick: _ => { this.setState({ groupBy: null }); },
            },
            ...this.props.configuration.columns
              .filter(col => col.isGroupable)
              .map((col, idx) => ({
                key: `${idx}`,
                name: col.name,
                onClick: _ => { this.setState({ groupBy: col }); },
              })),
          ],
        },
      });
    }
    if (this.props.showExcelExportButton) {
      items.push({
        key: "ExcelExport",
        name: strings.ExcelExportButtonLabel,
        iconProps: {
          iconName: 'ExcelDocument',
          styles: { root: { color: "green !important" } },
        },
        disabled: this.state.isExporting,
        onClick: _ => { this.exportToExcel(); },
      });
    }
    if (this.props.showViewSelector) {
      if (this.props.pageContext.legacyPageContext.isSiteAdmin) {
        farItems.push({
          key: 'NewView',
          name: strings.NewViewText,
          iconProps: { iconName: 'CirclePlus' },
          href: `${this.props.configuration.viewNewFormUrl}?Source=${encodeURIComponent(document.location.href)}`,
        });
      }
      farItems.push({
        key: 'View',
        name: this.state.currentView.title,
        iconProps: { iconName: 'List' },
        itemType: ContextualMenuItemType.Header,
        subMenuProps: {
          items: [
            {
              key: 'List',
              name: 'Liste',
              iconProps: { iconName: 'List' },
              canCheck: true,
              checked: !this.state.isCompact,
              onClick: _ => { this.setState({ isCompact: false }); },
            },
            {
              key: 'CompactList',
              name: 'Kompakt liste',
              iconProps: { iconName: 'AlignLeft' },
              canCheck: true,
              checked: this.state.isCompact,
              onClick: _ => { this.setState({ isCompact: true }); },
            },
            {
              key: 'divider_0',
              itemType: ContextualMenuItemType.Divider,
            },
            ...this.props.configuration.views.map(v => ({
              key: `${v.id}`,
              name: v.title,
              iconProps: { iconName: v.iconName },
              canCheck: true,
              checked: v.id === this.state.currentView.id,
              onClick: _ => { this.onChangeView(v); },
            } as IContextualMenuItem)),
            {
              key: 'divider_1',
              itemType: ContextualMenuItemType.Divider,
            },
            {
              key: 'SaveViewAs',
              name: strings.SaveViewAsText,
              disabled: true,
            },
            {
              key: 'EditView',
              name: strings.EditViewText,
              href: `${this.props.configuration.viewEditFormUrl}?ID=${this.state.currentView.id}&Source=${encodeURIComponent(document.location.href)}`,
            }
          ],
        },
      });
    }
    if (this.props.showFilters) {
      farItems.push({
        key: 'Filters',
        name: '',
        iconProps: { iconName: 'Filter' },
        itemType: ContextualMenuItemType.Normal,
        onClick: _ => { this.setState({ showFilterPanel: true }); },
      });
    }

    return (
      <div hidden={!this.props.showCommandBar}>
        <CommandBar items={items} farItems={farItems} />
      </div>
    );
  }

  private list() {
    const data = this.filteredData;

    return (
      <div className={styles.listContainer}>
        <DetailsList
          items={data.items}
          constrainMode={this.props.constrainMode}
          layoutMode={this.props.layoutMode}
          columns={data.columns}
          groups={data.groups}
          selectionMode={SelectionMode.none}
          onRenderItemColumn={(item, _index, column: PortfolioOverviewColumn) => renderItemColumn(item, column, state => this.setState(state))}
          onColumnHeaderClick={this.onColumnSort.bind(this)}
          compact={this.state.isCompact} />
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
      sortBy: column.setIsSortedDescending(isSortedDescending),
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
   * On dismiss <ProjectInformationModal />
   */
  private onDismissProjectInfoModal() {
    this.setState({ showProjectInfo: null });
  }

  /**
   * Get filtered data
   */
  private get filteredData() {
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
        .filter(key => key !== PortfolioOverviewFieldSelector.column.key)
        .reduce((_items, key) => _items.filter(i => activeFilters[key].indexOf(objectGet(i, key)) !== -1), items);
      const selectedFilters = activeFilters[PortfolioOverviewFieldSelector.column.key];
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
      let filters = this.getSelectedFiltersWithItems(refiners, this.props.configuration, currentView);
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
  private async onChangeView(view: PortfolioOverviewView): Promise<void> {
    if (this.state.currentView.id === view.id) {
      return;
    }
    this.setState({ isChangingView: view });
    const { items, refiners } = await this.props.dataAdapter.fetchDataForView(view, this.props.configuration, this.props.pageContext.site.id.toString());
    let filters = this.getSelectedFiltersWithItems(refiners, this.props.configuration, view);

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

  /**
   * Export to Excel
   */
  private async exportToExcel(): Promise<void> {
    this.setState({ isExporting: true });
    let { items, columns } = this.filteredData;
    try {
      await ExcelExportService.export(this.props.title, items, columns);
      this.setState({ isExporting: false });
    } catch (error) {
      this.setState({ isExporting: false });
    }
  }
}

export { IPortfolioOverviewProps };

