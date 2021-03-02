import { PortfolioAggregation } from 'components/PortfolioAggregation'
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'models'
import React, { Component } from 'react'
import styles from './BenefitsOverview.module.scss'
import { getColumns } from './columns'
import { BenefitsOverviewDefaultProps, IBenefitsOverviewProps } from './types'
import * as config from './config'

/**
 * @component BenefitsOverview
 * @extends Component
 */
export class BenefitsOverview extends Component<IBenefitsOverviewProps> {
  public static defaultProps = BenefitsOverviewDefaultProps

  public render(): React.ReactElement<IBenefitsOverviewProps> {
    const columns = getColumns(this.props)
    return (
      <div className={styles.benefitsOverview}>
        <PortfolioAggregation
          {...this.props}
          columns={columns}
          lockedColumns={true}
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
      .filter((res) => res.ContentTypeID.indexOf(config.CONTENT_TYPE_ID_BENEFITS) === 0)
      .map((res) => new Benefit(res))

    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf(config.CONTENT_TYPE_ID_MEASUREMENTS) === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf(config.CONTENT_TYPE_ID_INDICATORS) === 0)
      .map((res) => {
        const indicator = new BenefitMeasurementIndicator(res)
          .setMeasurements(measurements)
          .setBenefit(benefits)
        return indicator
      })
      .filter((i) => i.Benefit)
    return indicactors
  }
}

export * from './types'
