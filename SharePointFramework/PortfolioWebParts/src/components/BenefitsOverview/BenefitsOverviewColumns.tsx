import { IAggregatedSearchListColumn } from 'interfaces'
import { BenefitMeasurementIndicator } from 'models'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue } from 'pp365-shared/lib/helpers'
import React from 'react'
import BenefitMeasurementAchievement from './BenefitMeasurementAchievement'
import BenefitMeasurementsModal from './BenefitMeasurementsModal'
import { IBenefitsOverviewProps } from './types'

/**
 * Get columns for DetailsList
 *
 * @param {IBenefitsOverviewProps} props Props
 */
export function getColumns(props: IBenefitsOverviewProps): IAggregatedSearchListColumn[] {
  const columns: IAggregatedSearchListColumn[] = [
    {
      key: 'Benefit.Title',
      fieldName: 'Benefit.Title',
      name: strings.BenefitTitleLabel,
      minWidth: 100,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'Benefit.Responsible',
      fieldName: 'Benefit.Responsible',
      name: strings.BenefitResponsibleLabel,
      minWidth: 50,
      maxWidth: 180,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'Benefit.Owner',
      fieldName: 'Benefit.Owner',
      name: strings.BenefitOwnerLabel,
      minWidth: 50,
      maxWidth: 180,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'Title',
      fieldName: 'Title',
      name: strings.MeasuremenentIdicatorLabel,
      minWidth: 50,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'Unit',
      fieldName: 'Unit',
      name: strings.UnitLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'StartValue',
      fieldName: 'StartValue',
      fieldNameDisplay: 'StartValueDisplay',
      name: strings.StartValueLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'DesiredValue',
      fieldName: 'DesiredValue',
      fieldNameDisplay: 'DesiredValueDisplay',
      name: strings.DesiredValueLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'Measurements[0].Value',
      fieldName: 'Measurements[0].Value',
      fieldNameDisplay: 'Measurements[0].ValueDisplay',
      name: strings.LastMeasurementLabel,
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'Measurements[0].Achievement',
      fieldName: 'Measurements[0].Achievement',
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
