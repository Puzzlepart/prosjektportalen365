import * as React from 'react';
import * as moment from 'moment';
import Timeline, { TimelineMarkers, TodayMarker } from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import './Timeline.overrides.css';
import styles from './ResourceAllocation.module.scss';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import * as strings from 'ResourceAllocationWebPartStrings';
import { IResourceAllocationProps, ResourceAllocationDefaultProps } from './IResourceAllocationProps';
import { IResourceAllocationState } from './IResourceAllocationState';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { sp } from '@pnp/sp';
import DataSourceService from 'prosjektportalen-spfx-shared/lib/services/DataSourceService';
import { IAllocationSearchResult } from '../models/IAllocationSearchResult';
import tryParsePercentage from 'prosjektportalen-spfx-shared/lib/helpers/tryParsePercentage';
import { ITimelineData, ITimelineGroup, ITimelineItem } from '../interfaces';
import FilterPanel, { IFilterProps, IFilterItemProps } from '../../../components/FilterPanel';
import * as stringFormat from 'string-format';
import * as objectGet from 'object-get';

export default class ResourceAllocation extends React.Component<IResourceAllocationProps, IResourceAllocationState> {
  public static defaultProps = ResourceAllocationDefaultProps;

  /**
   * Constructor
   *
   * @param {IResourceAllocationProps} props Props
   */
  constructor(props: IResourceAllocationProps) {
    super(props);
    this.state = { isLoading: true, showFilterPanel: false, activeFilters: {} };
  }

  public async componentDidMount(): Promise<void> {
    try {
      const data = await this.fetchData();
      this.setState({ data, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IResourceAllocationProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.resourceAllocation}>
          <div className={styles.container}>
            <Spinner label={stringFormat(PortfolioWebPartsStrings.DataLoadingText, this.props.dataSource.toLowerCase())} type={SpinnerType.large} />
          </div>
        </div>
      );
    }
    if (this.state.error) {
      return (
        <div className={styles.resourceAllocation}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      );
    }

    const { groups, items } = this.getFilteredData();

    return (
      <div className={styles.resourceAllocation}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar
              items={this.getCommandBarItems().left}
              farItems={this.getCommandBarItems().right} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.infoText}>
            <MessageBar>
              <div dangerouslySetInnerHTML={{ __html: stringFormat(strings.InfoText, `../Lists/Ressursallokering/AllItems.aspx?Source=${encodeURIComponent(window.location.href)}`) }}></div>
            </MessageBar>
          </div>
          <div className={styles.timeline}>
            <Timeline
              groups={groups}
              items={items}
              stackItems={true}
              canMove={false}
              canChangeGroup={false}
              sidebarWidth={220}
              itemRenderer={({ item, itemContext, getItemProps }) => this.itemRenderer(item, itemContext, getItemProps)}
              defaultTimeStart={moment().subtract(1, 'months')}
              defaultTimeEnd={moment().add(1, 'years')}>
              <TimelineMarkers>
                <TodayMarker />
              </TimelineMarkers>
            </Timeline>
          </div>
        </div>
        <FilterPanel
          isOpen={this.state.showFilterPanel}
          headerText={PortfolioWebPartsStrings.FilterText}
          filters={this.getFilters()}
          onFilterChange={this.onFilterChange}
          onDismiss={() => this.setState({ showFilterPanel: false })} />
      </div>
    );
  }

  /**
   * Get filtered data
   */
  private getFilteredData(): ITimelineData {
    const { activeFilters, data } = ({ ...this.state } as IResourceAllocationState);
    const activeFiltersKeys = Object.keys(activeFilters);
    if (activeFiltersKeys.length > 0) {
      let items = activeFiltersKeys.reduce((_items, key) => _items.filter(i => activeFilters[key].indexOf(objectGet(i, key)) !== -1), data.items);
      let groups = data.groups.filter(grp => items.filter(i => i.group === grp.id).length > 0);
      return { items, groups };
    } else {
      return data;
    }
  }

  /**
   * Get filters
   */
  private getFilters(): IFilterProps[] {
    const columns = [
      { fieldName: 'project', name: PortfolioWebPartsStrings.SiteTitleLabel },
      { fieldName: 'resource', name: strings.ResourceLabel },
      { fieldName: 'role', name: strings.RoleLabel },
    ];
    return columns.map(col => ({
      column: { key: col.fieldName, minWidth: 0, ...col },
      items: this.state.data.items
        .map(i => objectGet(i, col.fieldName))
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .map(name => {
          const filter = this.state.activeFilters[col.fieldName];
          const selected = filter ? filter.indexOf(name) !== -1 : false;
          return { name, value: name, selected, };
        }),
    }));
  }

  /**
   * On filter change 
   *
   * @param {IColumn} column Column
   * @param {IFilterItemProps[]} selectedItems Selected items
   */
  @autobind
  private onFilterChange(column: IColumn, selectedItems: IFilterItemProps[]) {
    const { activeFilters } = ({ ...this.state } as IResourceAllocationState);
    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map(i => i.value);
    } else {
      delete activeFilters[column.fieldName];
    }
    this.setState({ activeFilters });
  }

  /**
   * Get command bar items
   */
  private getCommandBarItems() {
    const right = [
      {
        key: "Filter",
        name: PortfolioWebPartsStrings.FilterText,
        iconProps: { iconName: "Filter" },
        itemType: ContextualMenuItemType.Header,
        iconOnly: true,
        onClick: _event => {
          _event.preventDefault();
          this.setState({ showFilterPanel: true });
        }
      }
    ] as ICommandBarItemProps[];
    return { left: [], right };
  }

  /**
   * Timeline item renderer
   * 
   * @param {ITimelineItem} item Item
   * @param {any} itemContext Item context
   * @param {function} getItemProps Get item props functoon 
   */
  private itemRenderer(item: ITimelineItem, itemContext: any, getItemProps: (props: React.HTMLProps<HTMLDivElement>) => React.HTMLProps<HTMLDivElement>) {
    return (
      <div {...getItemProps(item.itemProps)}>
        <div className="rct-item-content" style={{ maxHeight: `${itemContext.dimensions.height}` }}>
          {item.title}
        </div>
      </div >
    );
  }

  /**
   * Create groups
   * 
   * @param {IAllocationSearchResult[]} searchResults Search results
   * @param {string} groupBy Group by
   * 
   * @returns {ITimelineGroup[]} Timeline groups
   */
  private createGroups(searchResults: IAllocationSearchResult[], groupBy: string = 'RefinableString71'): ITimelineGroup[] {
    const groupNames: string[] = searchResults.map(res => res[groupBy]).filter((value, index, self) => self.indexOf(value) === index);
    const groups: ITimelineGroup[] = groupNames.map((name, idx) => ({ id: idx, title: name }));
    return groups;
  }

  /**
   * Create items
   * 
   * @param {IAllocationSearchResult[]} searchResults Search results
   * @param {ITimelineGroup[]} groups Groups
   * @param {string} groupBy Group by
   * 
   * @returns {ITimelineItem[]} Timeline items
   */
  private createItems(searchResults: IAllocationSearchResult[], groups: ITimelineGroup[], groupBy: string = 'RefinableString71'): ITimelineItem[] {
    const items: ITimelineItem[] = searchResults.map((res, idx) => {
      const [group] = groups.filter(grp => grp.title === res[groupBy]);
      const allocation = tryParsePercentage(res.GtResourceLoadOWSNMBR, false, 0) as number;
      const isAbsence = res.ContentTypeId.indexOf('0x010029F45E75BA9CE340A83EFFB2927E11F4') !== -1;
      const itemOpacity = allocation < 30 ? 0.3 : (allocation / 100);
      const itemColor = allocation < 40 ? "#000" : "#fff";
      let backgroundColor = this.props.itemBgColor;
      if (isAbsence) {
        backgroundColor = this.props.itemAbsenceBgColor;
      }
      let itemStyle: React.CSSProperties = {
        color: itemColor,
        border: "none",
        cursor: "pointer",
        outline: "none",
        background: `rgb(${backgroundColor})`,
        backgroundColor: `rgba(${backgroundColor}, ${itemOpacity})`,
      };
      return {
        id: idx,
        group: group.id,
        title: isAbsence ? `${res.GtResourceAbsenceOWSCHCS} (${allocation})` : `${res.RefinableString72} - ${res.SiteTitle} (${allocation})`,
        start_time: moment(new Date(res.GtStartDateOWSDATE)),
        end_time: moment(new Date(res.GtEndDateOWSDATE)),
        itemProps: { style: itemStyle },
        project: res.SiteTitle,
        role: res.RefinableString72,
        resource: group.title,
      } as ITimelineItem;
    });
    return items;
  }

  /**
   * Fetch data
   * 
   * @returns {ITimelineData} Timeline data
   */
  private async fetchData(): Promise<ITimelineData> {
    const dataSource = await new DataSourceService(sp.web).getByName(this.props.dataSource);
    if (dataSource) {
      try {
        const results = (await sp.search({
          ...dataSource,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: ['Path', 'SPWebUrl', 'ContentTypeId', 'SiteTitle', 'RefinableString71', 'RefinableString72', 'GtResourceLoadOWSNMBR', 'GtResourceAbsenceOWSCHCS', 'GtStartDateOWSDATE', 'GtEndDateOWSDATE'],
        })).PrimarySearchResults as IAllocationSearchResult[];
        const groups = this.createGroups(results);
        const items = this.createItems(results, groups);
        return { items, groups };
      } catch (error) {
        throw '';
      }
    } else {
      throw stringFormat(PortfolioWebPartsStrings.DataSourceNotFound, this.props.dataSource);
    }
  }
}
