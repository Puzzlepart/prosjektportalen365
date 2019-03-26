import * as React from 'react';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import styles from './BenefitsOverview.module.scss';
import { IBenefitsOverviewProps, BenefitsOverviewDefaultProps } from './IBenefitsOverviewProps';
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'prosjektportalen-spfx-shared/lib/models';
import { IBenefitsSearchResult } from 'prosjektportalen-spfx-shared/lib/interfaces/IBenefitsSearchResult';
import DataSourceService from 'prosjektportalen-spfx-shared/lib/services/DataSourceService';
import { sp } from '@pnp/sp';
import * as stringFormat from 'string-format';
import AggregatedSearchList from '../../../components/AggregatedSearchList';
import { IAggregatedSearchListProps } from '../../../components/AggregatedSearchList/IAggregatedSearchListProps';

export default class BenefitsOverview extends React.Component<IBenefitsOverviewProps, {}> {
  public static defaultProps = BenefitsOverviewDefaultProps;
  /**
   * Constructor
   *
   * @param {IBenefitsOverviewProps} props Props
   */
  constructor(props: IBenefitsOverviewProps) {
    super(props);
  }

  public render() {
    return (
      <div className={styles.benefitsOverview}>
        <AggregatedSearchList {...this.props} customFetch={this.fetchMeasureIndicators} />
      </div>
    );
  }

  /**
   * Fetch measure indicators
   */
  private async fetchMeasureIndicators(props: IAggregatedSearchListProps): Promise<any[]> {
    try {
      let { queryTemplate, dataSource } = props;
      if (!queryTemplate) {
        const _dataSource = await new DataSourceService(sp.web).getByName(dataSource);
        if (_dataSource) {
          queryTemplate = _dataSource.QueryTemplate;
        } else {
          throw stringFormat(PortfolioWebPartsStrings.DataSourceNotFound, dataSource);
        }
      }

      const results = (await sp.search({
        QueryTemplate: queryTemplate,
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
    } catch (err) {
      throw err;
    }
  }
}

export { IBenefitsOverviewProps };