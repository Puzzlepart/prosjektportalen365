import * as React from 'react';
import styles from './BenefitsOverview.module.scss';
import { IBenefitsOverviewProps, BenefitsOverviewDefaultProps } from './IBenefitsOverviewProps';
import { IBenefitsOverviewState } from './IBenefitsOverviewState';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { DetailsList, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { sp } from '@pnp/sp';
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'prosjektportalen-spfx-shared/lib/models';
import { IBenefitsSearchResult } from 'prosjektportalen-spfx-shared/lib/interfaces/IBenefitsSearchResult';
import * as objectGet from 'object-get';
import DataSourceService from 'prosjektportalen-spfx-shared/lib/services/DataSourceService';

export default class BenefitsOverview extends React.Component<IBenefitsOverviewProps, IBenefitsOverviewState> {
  public static defaultProps = BenefitsOverviewDefaultProps;
  /**
   * Constructor
   *
   * @param {IBenefitsOverviewProps} props Props
   */
  constructor(props: IBenefitsOverviewProps) {
    super(props);
    this.state = { isLoading: true };
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
      return <Spinner label='Laster gevinstoversikt...' type={SpinnerType.large} />;
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
              onRenderItemColumn={(item: BenefitMeasurementIndicator, _index: number, column: IColumn) => objectGet(item, column.fieldName)} />
          </div>
        </div>
      </div>
    );
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
        throw `Finner ingen datakilde med navn '${this.props.dataSource}.'`;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
