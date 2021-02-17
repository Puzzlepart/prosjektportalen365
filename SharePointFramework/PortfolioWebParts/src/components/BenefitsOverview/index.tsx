import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'models'
import * as React from 'react'
import { AggregatedSearchList } from '../AggregatedSearchList'
import styles from './BenefitsOverview.module.scss'
import { getColumns } from './BenefitsOverviewColumns'
import { BenefitsOverviewDefaultProps, IBenefitsOverviewProps } from './IBenefitsOverviewProps'

const CONTENT_TYPE_ID_BENEFITS = '0x01004F466123309D46BAB9D5C6DE89A6CF67'
const CONTENT_TYPE_ID_MEASUREMENTS = '0x010039EAFDC2A1624C1BA1A444FC8FE85DEC'
const CONTENT_TYPE_ID_INDICATORS = '0x010073043EFE3E814A2BBEF96B8457623F95'

/**
 * @component BenefitsOverview
 * @extends React.Component
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export class BenefitsOverview extends React.Component<IBenefitsOverviewProps, {}> {
  public static defaultProps = BenefitsOverviewDefaultProps

  public render(): React.ReactElement<IBenefitsOverviewProps> {
    const columns = getColumns(this.props)
    return (
      <div className={styles.benefitsOverview}>
        <AggregatedSearchList
          {...this.props}
          columns={columns}
          postTransform={this._postTransform.bind(this)}
        />
      </div>
    )
  }

  /**
   * Post fetch
   *
   * @param {any]} results Results
   */
  private _postTransform(results: any[]): any[] {
    const benefits = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_BENEFITS) === 0)
      .map((res) => new Benefit(res))

    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_MEASUREMENTS) === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_INDICATORS) === 0)
      .map((res) => {
        const indicator = new BenefitMeasurementIndicator(res)
          .setMeasurements(measurements)
          .setBenefit(benefits)
        return indicator
      })
      .filter((i) => i.benefit)
    return indicactors
  }
}

export { IBenefitsOverviewProps }
