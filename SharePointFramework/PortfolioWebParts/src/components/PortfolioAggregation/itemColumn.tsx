import { getFileTypeIconProps, initializeFileTypeIcons } from '@fluentui/react-file-type-icons'
import { IColumn, Icon, Link } from '@fluentui/react/lib'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { formatDate, tryParseCurrency, tryParsePercentage } from 'pp365-shared/lib/helpers'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import React from 'react'
import { isEmpty } from 'underscore'
import { TagsColumn } from '../PortfolioOverview/RenderItemColumn/TagsColumn'
import { UserColumn } from '../PortfolioOverview/RenderItemColumn/UserColumn'
import ItemModal from './ItemModal'
import { IPortfolioAggregationProps } from './types'
initializeFileTypeIcons()

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
    case 'user':
      return columnValue && <UserColumn column={column} columnValue={columnValue} />
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
    case 'filename_with_icon':
      return (
        <span>
          <Icon
            {...getFileTypeIconProps({
              extension: item.FileExtension,
              size: 16,
              imageFileType: 'png'
            })}
            styles={{ root: { verticalAlign: 'bottom' } }}
          />
          <Link
            href={item.ServerRedirectedURL}
            rel='noopener noreferrer'
            target='_blank'
            style={{ marginLeft: 8 }}>
            {columnValue}
          </Link>
        </span>
      )
    default:
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

/**
 * Get default columns that should be included if the property `lockedColumns` is not
 * set to `true` in the web part properties, or if the data source level is set to
 * `Prosjekt`.
 *
 * @param props Props
 */
export const getDefaultColumns = (props: IPortfolioAggregationProps) => {
  if (props.lockedColumns || props.dataSourceLevel === 'Prosjekt') return []
  return [
    {
      key: 'SiteTitle',
      idx: 0,
      fieldName: 'SiteTitle',
      name: strings.SiteTitleLabel,
      minWidth: 150,
      maxWidth: 225,
      isResizable: true,
      onRender: (item: any) => {
        return (
          <ProjectInformationPanel
            key={item.SiteId}
            title={item.Title}
            siteId={item.SiteId}
            webUrl={item.Path}
            page='Portfolio'
            hideAllActions={true}
            webPartContext={props.webPartContext}
            onRenderToggleElement={(onToggle) => (
              <Icon
                iconName='Info'
                style={{
                  color: '666666',
                  marginLeft: 4,
                  position: 'relative',
                  top: '2px',
                  fontSize: '1.1em',
                  cursor: 'pointer'
                }}
                onClick={onToggle}
              />
            )}>
            <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
              {item.SiteTitle}
            </Link>
          </ProjectInformationPanel>
        )
      },
      data: { isGroupable: true }
    }
  ]
}
