import * as React from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import BenefitMeasurementsModal from './BenefitMeasurementsModal'
import { IBenefitsOverviewProps } from './IBenefitsOverviewProps'
import { getObjectValue } from 'shared/lib/helpers'
import { BenefitMeasurementIndicator } from 'models'
import BenefitMeasurementAchievement from './BenefitMeasurementAchievement'
import { IAggregatedSearchListColumn } from 'interfaces'

/**
 * Get columns for DetailsList
 *
 * @param {IBenefitsOverviewProps} props Props
 */
export function getColumns(props: IBenefitsOverviewProps): IAggregatedSearchListColumn[] {
  const columns: IAggregatedSearchListColumn[] = [
    {
      key: 'siteTitle',
      fieldName: 'siteTitle',
      name: strings.SiteTitleLabel,
      minWidth: 100,
      maxWidth: 180,
      isResizable: true,
      onRender: (indicator: BenefitMeasurementIndicator) => {
        const webUrl = getObjectValue<string>(indicator, 'webUrl', null)
        const siteTitle = getObjectValue<string>(indicator, 'siteTitle', null)
        return (
          <a href={webUrl} rel='noopener noreferrer' target='_blank'>
            {siteTitle}
          </a>
        )
      },
      isGroupable: true
    },
    {
      key: 'benefit.title',
      fieldName: 'benefit.title',
      name: strings.BenefitTitleLabel,
      minWidth: 100,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'benefit.responsible',
      fieldName: 'benefit.responsible',
      name: strings.BenefitResponsibleLabel,
      minWidth: 50,
      maxWidth: 180,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'benefit.owner',
      fieldName: 'benefit.owner',
      name: strings.BenefitOwnerLabel,
      minWidth: 50,
      maxWidth: 180,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'title',
      fieldName: 'title',
      name: strings.MeasuremenentIdicatorLabel,
      minWidth: 50,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'unit',
      fieldName: 'unit',
      name: strings.UnitLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'startValue',
      fieldName: 'startValue',
      fieldNameDisplay: 'startValueDisplay',
      name: strings.StartValueLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'desiredValue',
      fieldName: 'desiredValue',
      fieldNameDisplay: 'desiredValueDisplay',
      name: strings.DesiredValueLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'measurements[0].value',
      fieldName: 'measurements[0].value',
      fieldNameDisplay: 'measurements[0].valueDisplay',
      name: strings.LastMeasurementLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'measurements[0].achievement',
      fieldName: 'measurements[0].achievement',
      name: strings.MeasurementAchievementLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onRender: (indicator: BenefitMeasurementIndicator) => {
        const measurement = getObjectValue(indicator, 'measurements[0]', null)
        if (measurement) {
          return <BenefitMeasurementAchievement measurement={measurement} />
        }
        return null
      }
    },
    {
      fieldName: 'allMeasurements',
      key: 'allMeasurements',
      name: '',
      minWidth: 50,
      maxWidth: 80,
      onRender: (indicator: BenefitMeasurementIndicator) => (
        <BenefitMeasurementsModal indicator={indicator} />
      )
    }
  ]
  return columns.filter(
    (col) => getObjectValue<string[]>(props, 'hiddenColumns', []).indexOf(col.key) === -1
  )
}
