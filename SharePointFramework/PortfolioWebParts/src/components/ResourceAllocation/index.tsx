import { sp } from '@pnp/sp';
import { getId } from '@uifabric/utilities';
import { IAllocationSearchResult, ITimelineData, ITimelineGroup, ITimelineItem } from 'interfaces';
import * as moment from 'moment';
import * as objectGet from 'object-get';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import Timeline, { TimelineMarkers, TodayMarker, ReactCalendarItemRendererProps } from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import { tryParsePercentage } from 'shared/lib/helpers';
import { DataSourceService } from 'shared/lib/services';
import * as format from 'string-format';
import * as _ from 'underscore';
import { FilterPanel, IFilterItemProps, IFilterProps } from '../FilterPanel';
import { IResourceAllocationProps } from './IResourceAllocationProps';
import { IResourceAllocationState } from './IResourceAllocationState';
import styles from './ResourceAllocation.module.scss';
import './Timeline.overrides.css';

export class ResourceAllocation extends React.Component<IResourceAllocationProps, IResourceAllocationState> {
  public static defaultProps: Partial<IResourceAllocationProps> = {
    itemBgColor: '51,153,51',
    itemAbsenceBgColor: '26,111,179',
    defaultTimeStart: [-1, 'months'],
    defaultTimeEnd: [1, 'years'],
  };

  /**
   * Constructor
   *
   * @param {IResourceAllocationProps} props Props
   */
  constructor(props: IResourceAllocationProps) {
    super(props);
    this.state = { isLoading: true, showFilterPanel: false, activeFilters: {} };
    moment.locale('nb');
  }

  public async componentDidMount(): Promise<void> {
    try {
      const data = await this._fetchData();
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
            <Spinner label={format(strings.LoadingText, this.props.dataSource.toLowerCase())} type={SpinnerType.large} />
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

    const { groups, items } = this._getFilteredData();

    return (
      <div className={styles.resourceAllocation}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar
              items={this._getCommandBarItems().left}
              farItems={this._getCommandBarItems().right} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={styles.infoText}>
            <MessageBar>
              <div dangerouslySetInnerHTML={{ __html: format(strings.ResourceAllocationInfoText, encodeURIComponent(window.location.href)) }}></div>
            </MessageBar>
          </div>
          <div className={styles.timeline}>
            <Timeline
              groups={groups}
              items={items}
              stackItems={true}
              canMove={false}
              canChangeGroup={false}
              sidebarWidth={250}
              itemRenderer={this._itemRenderer.bind(this)}
              defaultTimeStart={moment().add(...this.props.defaultTimeStart)}
              defaultTimeEnd={moment().add(...this.props.defaultTimeEnd)}>
              <TimelineMarkers>
                <TodayMarker date={moment().toDate()} />
              </TimelineMarkers>
            </Timeline>
          </div>
        </div>
        <FilterPanel
          isOpen={this.state.showFilterPanel}
          headerText={strings.FilterText}
          filters={this._getFilters()}
          onFilterChange={this._onFilterChange.bind(this)}
          onDismiss={() => this.setState({ showFilterPanel: false })} />
      </div>
    );
  }

  /**
   * Get filtered data
   */
  private _getFilteredData(): ITimelineData {
    const { activeFilters, data } = ({ ...this.state } as IResourceAllocationState);
    const activeFiltersKeys = Object.keys(activeFilters);
    if (activeFiltersKeys.length > 0) {
      let items = activeFiltersKeys.reduce((newItems, key) => newItems.filter(i => activeFilters[key].indexOf(objectGet(i, key)) !== -1), data.items);
      let groups = data.groups.filter(grp => items.filter(i => i.group === grp.id).length > 0);
      return { items, groups };
    } else {
      return data;
    }
  }

  /**
   * Get filters
   */
  private _getFilters(): IFilterProps[] {
    const columns = [
      { fieldName: 'project', name: strings.SiteTitleLabel },
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
  private _onFilterChange(column: IColumn, selectedItems: IFilterItemProps[]) {
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
  private _getCommandBarItems() {
    const right = [
      {
        key: getId('Filter'),
        name: strings.FilterText,
        iconProps: { iconName: 'Filter' },
        itemType: ContextualMenuItemType.Header,
        iconOnly: true,
        onClick: ev => {
          ev.preventDefault();
          this.setState({ showFilterPanel: true });
        }
      }
    ] as ICommandBarItemProps[];
    return { left: [], right };
  }

  /**
   * Timeline item renderer
   */
  private _itemRenderer(props: ReactCalendarItemRendererProps<ITimelineItem>) {
    let htmlProps = props.getItemProps(props.item.itemProps);
    console.log('_itemRenderer', htmlProps);
    return (
      <div {...htmlProps}>
        <div className='rct-item-content' style={{ maxHeight: `${props.itemContext.dimensions.height}` }}>
          {props.item.title}
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
  private _transformGroups(searchResults: IAllocationSearchResult[], groupBy: string = 'RefinableString71'): ITimelineGroup[] {
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
  private _transformItems(searchResults: IAllocationSearchResult[], groups: ITimelineGroup[], groupBy: string = 'RefinableString71'): ITimelineItem[] {
    const items: ITimelineItem[] = searchResults.map((res, idx) => {
      const group = _.find(groups, grp => grp.title === res[groupBy]);
      const allocation = tryParsePercentage(res.GtResourceLoadOWSNMBR, false, 0) as number;
      const isAbsence = res.ContentTypeId.indexOf('0x010029F45E75BA9CE340A83EFFB2927E11F4') !== -1;
      const itemOpacity = allocation < 30 ? 0.3 : (allocation / 100);
      const itemColor = allocation < 40 ? '#000' : '#fff';
      let backgroundColor = this.props.itemBgColor;
      if (isAbsence) {
        backgroundColor = this.props.itemAbsenceBgColor;
      }
      let style: React.CSSProperties = {
        color: itemColor,
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background: `rgb(${backgroundColor})`,
        backgroundColor: `rgba(${backgroundColor}, ${itemOpacity})`,
      };
      return {
        id: idx,
        group: group.id,
        title: isAbsence ? `${res.GtResourceAbsenceOWSCHCS} (${allocation}%)` : `${res.RefinableString72} - ${res.SiteTitle} (${allocation}%)`,
        start_time: moment(new Date(res.GtStartDateOWSDATE)),
        end_time: moment(new Date(res.GtEndDateOWSDATE)),
        itemProps: { style },
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
  private async _fetchData(): Promise<ITimelineData> {
    const dataSource = await new DataSourceService(sp.web).getByName(this.props.dataSource);
    if (!dataSource) throw format(strings.DataSourceNotFound, this.props.dataSource);
    try {
      const results = (
        await sp.search({
          QueryTemplate: dataSource.searchQuery,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: ['Path', 'SPWebUrl', 'ContentTypeId', 'SiteTitle', 'RefinableString71', 'RefinableString72', 'GtResourceLoadOWSNMBR', 'GtResourceAbsenceOWSCHCS', 'GtStartDateOWSDATE', 'GtEndDateOWSDATE'],
        })
      ).PrimarySearchResults as IAllocationSearchResult[];
      const groups = this._transformGroups(results);
      const items = this._transformItems(results, groups);
      return { items, groups };
    } catch (error) {
      throw '';
    }
  }
}

export { IResourceAllocationProps };

