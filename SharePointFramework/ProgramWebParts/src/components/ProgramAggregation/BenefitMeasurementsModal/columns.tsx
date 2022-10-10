import { Icon } from 'office-ui-fabric-react'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import strings from 'ProgramWebPartsStrings'
import React from 'react'

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
    onRender: (measurement: any) => (
      <span>
        <span style={{ display: 'inline-block', width: 20 }}>
          {measurement.TrendIconProps && <Icon {...measurement.TrendIconProps} />}
        </span>
        <span>{measurement.AchievementDisplay}</span>
      </span>
    )
  },
  {
    key: 'DateDisplay',
    fieldName: 'DateDisplay',
    name: strings.MeasurementDateLabel,
    minWidth: 150
  }
]
