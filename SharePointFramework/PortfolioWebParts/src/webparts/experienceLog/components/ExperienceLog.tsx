import * as React from 'react';
import styles from './ExperienceLog.module.scss';
import * as strings from 'ExperienceLogWebPartStrings';
import { IExperienceLogProps, ExperienceLogDefaultProps } from './IExperienceLogProps';
import { IExperienceLogState } from './IExperienceLogState';
import { sp } from '@pnp/sp';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as objectGet from 'object-get';

export default class ExperienceLog extends React.Component<IExperienceLogProps, IExperienceLogState> {
  public static defaultProps = ExperienceLogDefaultProps;

  constructor(props: IExperienceLogProps) {
    super(props);
    this.state = { isLoading: true, columns: props.columns };
  }

  public async componentDidMount() {
    try {
      const items = await this.fetchData();
      this.setState({ items, isLoading: false });
    } catch (err) {
      this.setState({ items: [], isLoading: false });
    }
  }

  public render(): React.ReactElement<IExperienceLogProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.experienceLog}>
          <div className={styles.container}>
            <Spinner label={strings.LoadingText} type={SpinnerType.large} />
          </div>
        </div>
      );
    }

    let { items, columns, groups } = this.getFilteredData();

    return (
      <div className={styles.experienceLog}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar items={this.getCommandBarItems()} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
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
      </div >
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
    let { items, columns } = ({ ...this.state } as IExperienceLogState);

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
    let { items, columns, groupBy, searchTerm } = ({ ...this.state } as IExperienceLogState);
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
      return JSON.stringify(item).toLowerCase().indexOf(searchTerm || '') !== -1;
    });
    return { items, columns, groups };
  }


  private async fetchData() {
    let { PrimarySearchResults } = await sp.search({
      Querytext: "*",
      QueryTemplate: `DepartmentId:{${this.props.context.pageContext.legacyPageContext.hubSiteId}} ContentTypeId:0x01004EDD18CB92C14EBA97103D909C897810*`,
      TrimDuplicates: false,
      RowLimit: 500,
      SelectProperties: ["Path", "SPWebUrl", ...this.props.columns.map(col => col.key)],
    });
    return PrimarySearchResults;
  }

}
