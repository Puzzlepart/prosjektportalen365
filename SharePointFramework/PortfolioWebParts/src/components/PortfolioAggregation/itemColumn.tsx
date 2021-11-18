import { stringIsNullOrEmpty } from '@pnp/common'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { Link } from 'office-ui-fabric-react/lib/Link'
import strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared/lib/helpers/formatDate'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import React from 'react'
import { isEmpty } from 'underscore'
import { ProjectInformationTooltip } from 'pp365-projectwebparts/lib/components/ProjectInformationTooltip'
import { IPortfolioAggregationContext } from './context'
import { Web } from '@pnp/sp'
import { TagsColumn } from '../PortfolioOverview/RenderItemColumn/TagsColumn'

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
  switch (column?.data?.renderAs) {
    case 'int':
      return columnValue ? parseInt(columnValue) : null
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
    case 'tags': {
      return (
        <TagsColumn
          columnValue={columnValue}
          valueSeparator=';#'
          style={{ flexDirection: column.isMultiline ? 'column' : 'row' }}
        />
      )
    }
    default:
      return columnValue
  }
}

/**
 * Get default columns
 *
 * @param context Context
 */
export const getDefaultColumns = (context: IPortfolioAggregationContext, isParent?: boolean) => [
  {
    key: 'SiteTitle',
    fieldName: 'SiteTitle',
    name: strings.SiteTitleLabel,
    minWidth: 150,
    maxWidth: 225,
    isResizable: true,
    onRender: (item: any) => {
      if(!isParent) { return (
        <ProjectInformationTooltip
          key={item.SiteId}
          title={item.SiteTitle}
          siteId={item.SiteId}
          webUrl={item.SPWebURL}
          hubSite={{
            web: new Web(context.props.pageContext.site.absoluteUrl),
            url: context.props.pageContext.site.absoluteUrl
          }}
          page='Portfolio'>
          <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
            {item.SiteTitle}
          </Link>
        </ProjectInformationTooltip>
      ) }
      else {
        return item.SPWebURL ? <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>{item.SiteTitle}</Link> : <span>{item.SiteTitle}</span>
      }
    },
    data: { isGroupable: true }
  }
]
