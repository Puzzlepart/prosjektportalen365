import { getObjectValue } from 'shared/lib/helpers';
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'models';
import * as React from 'react';
import { AggregatedSearchList } from '../';
import styles from './BenefitsOverview.module.scss';
import { GetColumns } from './BenefitsOverviewColumns';
import { BenefitsOverviewDefaultProps, IBenefitsOverviewProps } from './IBenefitsOverviewProps';

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

  public render(): React.ReactElement<IBenefitsOverviewProps> {
    const columns = GetColumns(this.props);
    const groupByColumns = columns.filter(col => getObjectValue<boolean>(col, 'data.isGroupable', false));
    return (
      <div className={styles.benefitsOverview}>
        <AggregatedSearchList
          {...this.props}
          columns={columns}
          groupByColumns={groupByColumns}
          postTransform={this.postTransform.bind(this)} />
      </div>
    );
  }

  /**
   * Post fetch
   * 
   * @param {any]} results Results
   */
  private postTransform(results: any[]): any[] {
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
  }
}

export { IBenefitsOverviewProps };
