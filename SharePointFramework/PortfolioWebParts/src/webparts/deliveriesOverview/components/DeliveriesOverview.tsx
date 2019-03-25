import * as React from 'react';
import * as strings from 'DeliveriesOverviewWebPartStrings';
import styles from './DeliveriesOverview.module.scss';
import { Spinner, SpinnerType } from "office-ui-fabric-react/lib/Spinner";
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import { MessageBar, MessageBarType } from "office-ui-fabric-react/lib/MessageBar";
import { DetailsList, IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IDeliveriesOverviewProps, DeliveriesOverviewDefaultProps } from './IDeliveriesOverviewProps';
import { IDeliveriesOverviewState } from './IDeliveriesOverviewState';
import { sp } from '@pnp/sp';
import DataSourceService from 'prosjektportalen-spfx-shared/lib/services/DataSourceService';
import * as objectGet from 'object-get';

export default class DeliveriesOverview extends React.Component<IDeliveriesOverviewProps, IDeliveriesOverviewState> {
  public static defaultProps = DeliveriesOverviewDefaultProps;

  /**
   * Constructor
   *
   * @param {IDeliveriesOverviewProps} props Props
   */
  constructor(props: IDeliveriesOverviewProps) {
    super(props);
    this.state = { isLoading: true, columns: props.columns };
  }

  public async componentDidMount(): Promise<void> {
    try {
      const items = await this.fetchItems();
      this.setState({ items, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IDeliveriesOverviewProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.deliveriesOverview}>
          <div className={styles.container}>
            <Spinner label={strings.LoadingText} type={SpinnerType.large} />
          </div>
        </div>
      );
    }
    if (this.state.error) {
      return (
        <div className={styles.deliveriesOverview}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      );
    }

    let { items, columns, groups } = this.getFilteredData();

    return (
      <div className={styles.deliveriesOverview}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar items={this.getCommandBarItems()} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{strings.Title}</div>
          </div>
          <div className={styles.searchBox}>
            <SearchBox onChange={this.onSearch} labelText={strings.SearchBoxLabelText} />
          </div>
          <div className={styles.listContainer}>
            <DetailsList
              items={items}
              columns={columns}
              groups={groups}
              onColumnHeaderClick={this.onColumnHeaderSort} />
          </div>
        </div>
      </div>
    );
  }

  /**
   * On search
   * 
   * Makes the search term lower case and sets state
   * 
   * @param {string} searchTerm Search term
   */
  @autobind
  private onSearch(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.toLowerCase() });
  }

  /**
   * Sorting on column header click
   *
* @param {React.MouseEvent} _event Event
* @param {IColumn} column Column
    */
  @autobind
  private onColumnHeaderSort(_event: React.MouseEvent<any>, column: IColumn): any {
    let { items, columns } = ({ ...this.state } as IDeliveriesOverviewState);

    let isSortedDescending = column.isSortedDescending;
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }
    items = items.concat([]).sort((a, b) => {
      let aValue = objectGet(a, column.fieldName);
      let bValue = objectGet(b, column.fieldName);
      return isSortedDescending ? (aValue > bValue ? -1 : 1) : (aValue > bValue ? 1 : -1);
    });
    columns = columns.map(_column => {
      _column.isSorted = (_column.key === column.key);
      if (_column.isSorted) {
        _column.isSortedDescending = isSortedDescending;
      }
      return _column;
    });
    this.setState({ items, columns });
  }

  /**
   * Get command bar items
   */
  private getCommandBarItems(): ICommandBarItemProps[] {
    const items: ICommandBarItemProps[] = [];

    if (this.props.groupByColumns.length > 0) {
      const noGrouping: IColumn = {
        key: "NoGrouping",
        fieldName: "NoGrouping",
        name: strings.NoGroupingText,
        minWidth: 0,
      };
      const subItems = [noGrouping, ...this.props.groupByColumns].map(item => ({
        key: item.key,
        name: item.name,
        onClick: () => this.setState({ groupBy: item }),
      }));
      items.push({
        key: "Group",
        name: objectGet(this.state, 'groupBy.name') || strings.NoGroupingText,
        iconProps: { iconName: "GroupedList" },
        itemType: ContextualMenuItemType.Header,
        onClick: event => event.preventDefault(),
        subMenuProps: { items: subItems },
      });
    }

    return items;
  }

  /**
   * Get filtered data
   */
  private getFilteredData() {
    let { items, columns, groupBy, searchTerm } = ({ ...this.state } as IDeliveriesOverviewState);
    let groups: IGroup[] = null;
    if (groupBy && groupBy.key !== "NoGrouping") {
      const itemsSortedByGroupBy = items.sort((a, b) => objectGet(a, groupBy.key) > objectGet(b, groupBy.key) ? -1 : 1);
      const groupNames: string[] = itemsSortedByGroupBy.map(g => objectGet(g, groupBy.key));
      groups = groupNames
        .filter((value, index, self) => self.indexOf(value) === index)
        .map((name, idx) => ({
          key: `Group_${idx}`,
          name: `${groupBy.name}: ${name}`,
          startIndex: groupNames.indexOf(name, 0),
          count: [].concat(groupNames).filter(n => n === name).length,
          isCollapsed: false,
          isShowingAll: true,
          isDropEnabled: false,
        }));
    }
    items = items.filter(item => {
      return (
        objectGet(item, 'title').toLowerCase().indexOf(searchTerm || '') !== -1
        ||
        objectGet(item, 'benefit.title').toLowerCase().indexOf(searchTerm || '') !== -1
      );
    });
    return { items, columns, groups };
  }

  /**
   * Fetch items
   */
  private async fetchItems() {
    const dataSource = await new DataSourceService(sp.web).getByName(this.props.dataSource);
    if (dataSource) {
      try {
        const { PrimarySearchResults } = await sp.search({
          ...dataSource,
          Querytext: "*",
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: ["Path", "SPWebUrl", ...this.props.columns.map(col => col.key)],
        });
        return PrimarySearchResults;
      } catch (err) {
        throw err;
      }
    } else {
      throw `Finner ingen datakilde med navn '${this.props.dataSource}.'`;
    }
  }
}
