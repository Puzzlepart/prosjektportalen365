import { PortfolioAggregation } from 'components/PortfolioAggregation'
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'models'
import React, { FunctionComponent } from 'react'
import styles from './BenefitsOverview.module.scss'
import { getColumns } from './columns'
import * as config from './config'
import { IBenefitsOverviewProps } from './types'

export const BenefitsOverview: FunctionComponent<IBenefitsOverviewProps> = (props) => {
  /**
   * Post fetch
   *
   * @param results Results
   */
  const postTransform = (results: any[]): any[] => {
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

  const columns = getColumns(props)

  return (
    <div className={styles.benefitsOverview}>
      <PortfolioAggregation
        {...props}
        columns={columns}
        lockedColumns={true}
        postTransform={postTransform.bind(this)}
      />
    </div>
  )
}

BenefitsOverview.defaultProps = {
  selectProperties: [
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
    'GtGainsResponsible',
    'GtGainsOwner'
  ],
  showExcelExportButton: true
}

export * from './types'
