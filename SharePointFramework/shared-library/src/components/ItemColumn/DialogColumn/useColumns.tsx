import { TableCellLayout, TableColumnDefinition, Text } from '@fluentui/react-components'
import React from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import { Icon } from '@fluentui/react'

export interface IColumn extends TableColumnDefinition<any> {
  minWidth?: number
  defaultWidth?: number
}

export const useColumns = (): IColumn[] => {
  return [
    {
      columnId: 'measurementValue',
      minWidth: 60,
      defaultWidth: 80,
      compare: () => {
        return null
      },
      renderHeaderCell: () => {
        return strings.MeasurementValueLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.ValueDisplay}>
            <Text size={200}>{item.ValueDisplay}</Text>
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'comment',
      minWidth: 100,
      defaultWidth: 180,
      compare: () => {
        return null
      },
      renderHeaderCell: () => {
        return strings.MeasurementCommentLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.Comment} style={{ padding: '8px 0' }}>
            <Text size={200}>{item.Comment}</Text>
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'achievement',
      minWidth: 80,
      defaultWidth: 100,
      compare: () => {
        return null
      },
      renderHeaderCell: () => {
        return strings.MeasurementAchievementLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.Achievement}>
            <span>
              <span style={{ display: 'inline-block', width: 20 }}>
                {item.TrendIconProps && <Icon {...item.TrendIconProps} />}
              </span>
              <Text size={200}>{item.AchievementDisplay}</Text>
            </span>
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'date',
      minWidth: 80,
      defaultWidth: 110,
      compare: () => {
        return null
      },
      renderHeaderCell: () => {
        return strings.MeasurementDateLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.DateDisplay}>
            <Text size={200}>{item.DateDisplay}</Text>
          </TableCellLayout>
        )
      }
    }
  ]
}
