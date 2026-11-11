import { TableCellLayout, Text } from '@fluentui/react-components'
import React from 'react'
import * as strings from 'SharedLibraryStrings'
import { getFluentIcon } from '../../../icons'
import { ITrendIcon } from '../../../types'
import { TREND_ICON_SIZE } from '../TrendColumn'

import { IDataGridColumn } from '../../DataGridList/types'

export const useColumns = (): IDataGridColumn[] => {
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
        const icon: ITrendIcon | undefined = item.TrendIcon
        return (
          <TableCellLayout truncate title={item.Achievement}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', width: 20 }}>
                {icon &&
                  getFluentIcon(icon.iconName, {
                    color: icon.color,
                    size: TREND_ICON_SIZE,
                    filled: true
                  })}
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
