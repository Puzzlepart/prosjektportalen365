import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import styles from './BenefitsOverview.module.scss';
import { IBenefitsOverviewProps, BenefitsOverviewDefaultProps } from './IBenefitsOverviewProps';
import { IBenefitsOverviewState } from './IBenefitsOverviewState';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { DetailsList, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'prosjektportalen-spfx-shared/lib/models';
import { IBenefitsSearchResult } from 'prosjektportalen-spfx-shared/lib/interfaces/IBenefitsSearchResult';
import DataSourceService from 'prosjektportalen-spfx-shared/lib/services/DataSourceService';
import { sp } from '@pnp/sp';
import * as objectGet from 'object-get';
import * as stringFormat from 'string-format';

export default class BenefitsOverview extends React.Component<IBenefitsOverviewProps, IBenefitsOverviewState> {
  public static defaultProps = BenefitsOverviewDefaultProps;
  /**
   * Constructor
   *
   * @param {IBenefitsOverviewProps} props Props
   */
  constructor(props: IBenefitsOverviewProps) {
    super(props);
    this.state = { isLoading: true, columns: props.columns };
  }

  public async componentDidMount(): Promise<void> {
    try {
      const items = await this.fetchItems();
      this.setState({ items, isLoading: false });
    } catch (err) {
      this.setState({ items: [], isLoading: false });
    }
  }

  public render(): React.ReactElement<IBenefitsOverviewProps> {
    if (this.state.isLoading) {
      return <Spinner label={strings.LoadingText} type={SpinnerType.large} />;
    }

    return (
      <div className={styles.benefitsOverview}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar items={[]} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>Gevinstoversikt</div>
          </div>
          <div className={styles.listContainer}>
            <DetailsList
              items={this.state.items}
              columns={this.props.columns}
              onRenderItemColumn={this.onRenderItemColumn}
              onColumnHeaderClick={this.onColumnHeaderSort} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private onRenderItemColumn(item: BenefitMeasurementIndicator, index: number, column: IColumn) {
    const fieldNameDisplay: string = objectGet(column, 'data.fieldNameDisplay');
    return column.onRender ? column.onRender(item, index, column) : objectGet(item, fieldNameDisplay || column.fieldName);
  }

  /**
   * Sorting on column header click
   *
   * @param {React.MouseEvent} _event Event
   * @param {IColumn} column Column
   */
  @autobind
  private onColumnHeaderSort(_event: React.MouseEvent<any>, column: IColumn): any {
    let { items, columns } = ({ ...this.state } as IBenefitsOverviewState);

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
   * Fetch items
   */
  private async fetchItems() {
    try {
      const dataSource = await new DataSourceService(sp.web).getByName(this.props.dataSource, this.props.context.pageContext.legacyPageContext.hubSiteId);
      if (dataSource) {
        const results = (await sp.search({
          ...dataSource,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: [
            'Path',
            'SPWebURL',
            'Title',
            'ListItemId',
            'SiteTitle',
            'SiteId',
            'ContentTypeID',
            'GtDesiredValueOWSNMBR',
            'GtMeasureIndicatorOWSTEXT',
            'GtMeasurementUnitOWSCHCS',
            'GtStartValueOWSNMBR',
            'GtMeasurementValueOWSNMBR',
            'GtMeasurementCommentOWSMTXT',
            'GtMeasurementDateOWSDATE',
            'GtGainsResponsibleOWSUSER',
            'GtGainsTurnoverOWSMTXT',
            'GtGainsTypeOWSCHCS',
            'GtPrereqProfitAchievementOWSMTXT',
            'GtRealizationTimeOWSDATE',
            'GtGainLookupId',
            'GtMeasureIndicatorLookupId',
            'GtGainsResponsible'
          ],
        })).PrimarySearchResults as IBenefitsSearchResult[];

        const benefits = results
          .filter(res => res.ContentTypeID.indexOf('0x01004F466123309D46BAB9D5C6DE89A6CF67') === 0)
          .map(res => new Benefit(res));

        const measurements = results
          .filter(res => res.ContentTypeID.indexOf('0x010039EAFDC2A1624C1BA1A444FC8FE85DEC') === 0)
          .map(res => new BenefitMeasurement(res))
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        const indicactors = results
          .filter(res => res.ContentTypeID.indexOf('0x010073043EFE3E814A2BBEF96B8457623F95') === 0)
          .map(res => {
            let _indicator = new BenefitMeasurementIndicator(res)
              .setMeasurements(measurements)
              .setBenefit(benefits);
            return _indicator;
          })
          .filter(i => i.benefit);

        return indicactors;
      } else {
        throw stringFormat(strings.DataSourceNotFound, this.props.dataSource);
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
