import * as React from 'react';
import Timeline, { TimelineMarkers, TodayMarker } from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import './Timeline.overrides.css';
import styles from './ResourceAllocation.module.scss';
import { IResourceAllocationProps } from './IResourceAllocationProps';
import { IResourceAllocationState } from './IResourceAllocationState';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as moment from 'moment';
import { sp } from '@pnp/sp';
import DataSourceService from 'prosjektportalen-spfx-shared/lib/services/DataSourceService';
import { ITimelineData } from 'prosjektportalen-spfx-shared/lib/interfaces/ITimelineData';
import { IAllocationSearchResult } from '../models/IAllocationSearchResult';
import { ITimelineGroup } from 'prosjektportalen-spfx-shared/lib/interfaces/ITimelineGroup';
import { ITimelineItem } from 'prosjektportalen-spfx-shared/lib/interfaces/ITimelineItem';
import tryParsePercentage from 'prosjektportalen-spfx-shared/lib/helpers/tryParsePercentage';

export default class ResourceAllocation extends React.Component<IResourceAllocationProps, IResourceAllocationState> {
  /**
   * Constructor
   *
   * @param {IResourceAllocationProps} props Props
   */
  constructor(props: IResourceAllocationProps) {
    super(props);
    this.state = { isLoading: true };
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
      return null;
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

    return (
      <div className={styles.resourceAllocation}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar items={[]} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>Ressursallokering</div>
          </div>
          <div className={styles.timeline}>
            <Timeline
              groups={this.state.data.groups}
              items={this.state.data.items}
              stackItems={true}
              canMove={false}
              canChangeGroup={false}
              sidebarWidth={220}
              defaultTimeStart={moment().subtract(1, 'months')}
              defaultTimeEnd={moment().add(1, 'years')}>
              <TimelineMarkers>
                <TodayMarker />
              </TimelineMarkers>
            </Timeline>
          </div>
        </div>
      </div>
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
    const groups: ITimelineGroup[] = groupNames.map((name, idx) => ({
      id: idx,
      title: name,
    }));
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
  private createItems(searchResults: IAllocationSearchResult[], groups: ITimelineGroup[], groupBy: string = 'RefinableString71'): ITimelineItem<moment.Moment>[] {
    const items: ITimelineItem<moment.Moment>[] = searchResults.map((res, idx) => {
      const [group] = groups.filter(grp => grp.title === res[groupBy]);
      const allocation = tryParsePercentage(res.GtResourceLoadOWSNMBR, 'N/A');
      return {
        id: idx,
        group: group.id,
        title: res.GtResourceAbsenceOWSCHCS ? `${res.GtResourceAbsenceOWSCHCS} (${allocation})` : `${res.RefinableString72} - ${res.SiteTitle} (${allocation})`,
        start_time: moment(new Date(res.GtStartDateOWSDATE)),
        end_time: moment(new Date(res.GtEndDateOWSDATE)),
      };
    });
    return items;
  }

  /**
   * Fetch data
   * 
   * @returns {ITimelineData} Timeline data
   */
  private async fetchData(): Promise<ITimelineData<moment.Moment>> {
    const dataSource = await new DataSourceService(sp.web).getByName(this.props.dataSource);
    if (dataSource) {
      try {
        const searchResults = (await sp.search({
          ...dataSource,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: ['Path', 'SPWebUrl', 'SiteTitle', 'RefinableString71', 'RefinableString72', 'GtResourceLoadOWSNMBR', 'GtResourceAbsenceOWSCHCS', 'GtStartDateOWSDATE', 'GtEndDateOWSDATE'],
        })).PrimarySearchResults as IAllocationSearchResult[];
        const groups = this.createGroups(searchResults);
        const items = this.createItems(searchResults, groups);
        return { items, groups };
      } catch (error) {
        throw '';
      }
    } else {
      throw `Finner ingen datakilde med navn '${this.props.dataSource}.'`;
    }
  }
}
