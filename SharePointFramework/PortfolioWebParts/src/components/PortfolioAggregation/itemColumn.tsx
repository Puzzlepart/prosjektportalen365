import { stringIsNullOrEmpty } from '@pnp/common'
import { IColumn, Link, Icon } from 'office-ui-fabric-react/lib'
import { formatDate, tryParseCurrency, tryParsePercentage } from 'pp365-shared/lib/helpers'
import strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import React from 'react'
import { isEmpty } from 'underscore'
import { TagsColumn } from '../PortfolioOverview/RenderItemColumn/TagsColumn'
import ItemModal from './ItemModal'

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

  const type = column?.data ? column?.data?.renderAs : column['dataType']

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
    case 'user':
      return columnValue // TODO: Implement user rendering correctly at some point
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
    case 'tags':
      return (
        <TagsColumn
          columnValue={columnValue}
          valueSeparator=';#'
          style={{ flexDirection: column.isMultiline ? 'column' : 'row' }}
        />
      )
    case 'trend': {
      const trend = columnValue ? JSON.parse(columnValue) : null
      return (
        <span>
          <span style={{ display: 'inline-block', width: 20 }}>
            {trend.TrendIconProps && <Icon {...trend.TrendIconProps} />}
          </span>
          <span>{trend.AchievementDisplay}</span>
        </span>
      )
    }
    case 'modal':
      return <ItemModal title={item.MeasurementIndicator} value={JSON.parse(columnValue)} />
    default:
      return columnValue
  }
}

/**
 * Get default columns
 */
export const getDefaultColumns = (isParent?: boolean) => [ // context: IPortfolioAggregationContext, 
  {
    key: 'SiteTitle',
    idx: 0,
    fieldName: 'SiteTitle',
    name: strings.SiteTitleLabel,
    minWidth: 150,
    maxWidth: 225,
    isResizable: true,
    onRender: (item: any) => {
      if (!isParent) {
        //   return ( // TODO: REDO how tooltip is rendered, use panel instead and make this non dependendt of projectWebParts
        //     <ProjectInformationTooltip
        //       key={item.SiteId}
        //       title={item.SiteTitle}
        //       siteId={item.SiteId}
        //       webUrl={item.SPWebURL}
        //       hubSite={{
        //         web: new Web(context.props.pageContext.site.absoluteUrl),
        //         url: context.props.pageContext.site.absoluteUrl
        //       }}
        //       page='Portfolio'>
        //       <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
        //         {item.SiteTitle}
        //       </Link>
        //     </ProjectInformationTooltip>
        //   )
        // } else {
        return item.SPWebURL ? (
          <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
            {item.SiteTitle}
          </Link>
        ) : (
          <span>{item.SiteTitle}</span>
        )
      }
    },
    data: { isGroupable: true }
  }
]
