import { BenefitMeasurement } from 'models'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import * as strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { BenefitMeasurementAchievement } from '../BenefitMeasurementAchievement'

export const columns: IColumn[] = [
  {
    key: 'Value',
    fieldName: 'Value',
    name: strings.MeasurementValueLabel,
    minWidth: 100,
    maxWidth: 100,
    data: { fieldNameDisplay: 'ValueDisplay' },
    isResizable: true
  },
  {
    key: 'Comment',
    fieldName: 'Comment',
    name: strings.MeasurementCommentLabel,
    minWidth: 175,
    maxWidth: 175,
    isMultiline: true,
    isResizable: true
  },
  {
    key: 'Achievement',
    fieldName: 'Achievement',
    name: strings.MeasurementAchievementLabel,
    minWidth: 100,
    maxWidth: 100,
    isResizable: true,
    onRender: (measurement: BenefitMeasurement) => (
      <BenefitMeasurementAchievement measurement={measurement} />
    )
  },
  {
    key: 'DateDisplay',
    fieldName: 'DateDisplay',
    name: strings.MeasurementDateLabel,
    minWidth: 150
  }
]
