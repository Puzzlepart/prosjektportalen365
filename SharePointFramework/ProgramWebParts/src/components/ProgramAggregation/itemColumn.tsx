import { stringIsNullOrEmpty } from '@pnp/common'
import { IColumn, Icon, Link } from '@fluentui/react/lib'
import { formatDate, tryParseCurrency, tryParsePercentage } from 'pp365-shared/lib/helpers'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import strings from 'ProgramWebPartsStrings'
import React from 'react'
import { BenefitMeasurementsModal } from './BenefitMeasurementsModal'
import { isEmpty } from '@microsoft/sp-lodash-subset'

/**
 * Render item column
 *
 * @param item Item
 * @param index Index
 * @param column Column
 */
export const renderItemColumn = (item: any, index: number, column: IColumn) => {
  if (!column.fieldName) return null
  if (column.onRender) return column.onRender(item, index, column)
  if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
    return get(item, column['fieldNameDisplay'], null)
  }
  const columnValue = get(item, column.fieldName, null)
  const type = column?.data?.renderAs ?? column['dataType']

  switch (type) {
    case 'number':
      return columnValue ? parseInt(columnValue) : null
    case 'int':
      return columnValue ? parseInt(columnValue) : null
    case 'percentage':
      return columnValue ? tryParsePercentage(columnValue, true, 0) : null
    case 'currency':
      return columnValue ? tryParseCurrency(columnValue) : null
    case 'date':
      return formatDate(columnValue, false)
    case 'datetime':
      return formatDate(columnValue, true)
    case 'list': {
      const values: string[] = columnValue ? columnValue.split(';#') : []
      if (isEmpty(values)) return null
      return (
        <ul style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
          {values.map((v, idx) => (
            <li key={idx}>{v}</li>
          ))}
        </ul>
      )
    }
    case 'BenefitMeasurementTrend': {
      if (!columnValue) return null
      const trendIconProps = get(item, 'Measurements[0].TrendIconProps', {})
      const achievementDisplay = get(item, 'Measurements[0].AchievementDisplay', {})
      return (
        <span>
          <span style={{ display: 'inline-block', width: 20 }}>
            {trendIconProps && <Icon {...trendIconProps} />}
          </span>
          <span>{achievementDisplay}</span>
        </span>
      )
    }
    case 'BenefitMeasurementsModal':
      return <BenefitMeasurementsModal title={item.Title} value={item.Measurements} />
    default: {
      switch (column.fieldName) {
        case 'Title': {
          return (
            <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
              {columnValue}
            </Link>
          )
        }
        default: {
          return columnValue
        }
      }
    }
  }
}

/**
 * Get default columns
 */
export const getDefaultColumns = () => [
  {
    key: 'SiteTitle',
    idx: 0,
    fieldName: 'SiteTitle',
    name: strings.SiteTitleLabel,
    minWidth: 150,
    maxWidth: 225,
    isResizable: true,
    onRender: (item: any) => {
      return item.SPWebURL ? (
        <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
          {item.SiteTitle}
        </Link>
      ) : (
        <span>{item.SiteTitle}</span>
      )
    },
    data: { isGroupable: true }
  }
]
