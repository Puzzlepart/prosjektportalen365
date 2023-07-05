import { IColumn, Link, TooltipHost } from '@fluentui/react'

import { Icon } from '@fluentui/react/lib/Icon'
import { stringIsNullOrEmpty } from '@pnp/common'
import * as strings from 'PortfolioWebPartsStrings'
import {
  ColumnDataType,
  formatDate,
  tryParseCurrency,
  tryParseJson,
  getObjectValue as get
} from 'pp365-shared-library'
import React from 'react'
import { IListProps } from '../types'
import { TagsColumn } from './TagsColumn'
import { TitleColumn } from './TitleColumn'
import { UserColumn } from './UserColumn'
import { IRenderItemColumnProps, ItemRenderFunction } from './types'
import ItemModal from '../ItemModal'
import { getFileTypeIconProps } from '@fluentui/react-file-type-icons'

/**
 * Mapping for rendering of the different data types.
 */
const renderDataTypeMap: Record<ColumnDataType, ItemRenderFunction> = {
  text: (props: IRenderItemColumnProps) => <span>{props.columnValue}</span>,
  note: (props: IRenderItemColumnProps) => <span>{props.columnValue}</span>,
  user: (props: IRenderItemColumnProps) => <UserColumn {...props} />,
  date: (props: IRenderItemColumnProps) => {
    const includeTime = props.dataTypeProperties.get('includeTime') ?? false
    return <span>{formatDate(props.columnValue, includeTime)}</span>
  },
  currency: (props: IRenderItemColumnProps) => {
    const currencyPrefix = props.dataTypeProperties.get('currencyPrefix') ?? 'kr'
    const minimumFractionDigits = props.dataTypeProperties.get('minimumFractionDigits') ?? 0
    const maximumFractionDigits = props.dataTypeProperties.get('maximumFractionDigits') ?? 0
    return (
      <span>
        {tryParseCurrency(
          props.columnValue,
          undefined,
          currencyPrefix,
          minimumFractionDigits,
          maximumFractionDigits
        )}
      </span>
    )
  },
  tags: (props: IRenderItemColumnProps) => (
    <TagsColumn {...props} valueSeparator={props.dataTypeProperties.get('valueSeparator')} />
  ),
  boolean: (props: IRenderItemColumnProps) => {
    const valueIfTrue = props.dataTypeProperties.get('valueIfTrue') ?? strings.BooleanYes
    const valueIfFalse = props.dataTypeProperties.get('valueIfFalse') ?? strings.BooleanNo
    const displayValue = parseInt(props.columnValue) === 1 ? valueIfTrue : valueIfFalse
    return <span>{displayValue}</span>
  },
  url: (props: IRenderItemColumnProps) => {
    // eslint-disable-next-line prefer-const
    let [url, description] = props.columnValue.split(', ').filter((v) => !stringIsNullOrEmpty(v))
    const target = props.dataTypeProperties.get('openInNewTab') === false ? '_self' : '_blank'
    if (stringIsNullOrEmpty(description)) {
      description = props.dataTypeProperties.get('description') ?? url
    }
    return (
      <Link href={url} target={target} rel='noopener noreferrer'>
        {description}
      </Link>
    )
  },
  trend: (props: IRenderItemColumnProps) => {
    const trend = tryParseJson(props.columnValue, null)
    return trend ? (
      <span>
        <span style={{ display: 'inline-block', width: 20 }}>
          {trend.TrendIconProps && <Icon {...trend.TrendIconProps} />}
        </span>
        <span>{trend.AchievementDisplay}</span>
      </span>
    ) : null
  },
  modal: (props: IRenderItemColumnProps) => {
    return (
      <ItemModal title={props.item.MeasurementIndicator} value={JSON.parse(props.columnValue)} />
    )
  },
  filename_with_icon: (props: IRenderItemColumnProps) => {
    return (
      <span>
        <Icon
          {...getFileTypeIconProps({
            extension: props.item.FileExtension,
            size: 16,
            imageFileType: 'png'
          })}
          styles={{ root: { verticalAlign: 'bottom' } }}
        />
        <Link
          href={props.item.ServerRedirectedURL}
          rel='noopener noreferrer'
          target='_blank'
          style={{ marginLeft: 8 }}
        >
          {props.columnValue}
        </Link>
      </span>
    )
  }
}

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function. Also the `Title` column has a custom render
 * function by default and can not be overridden.
 *
 * @param item Item to render the value for
 * @param column Column to render the value for
 * @param props Props for the component `<List />`
 */
function renderItemColumn(item: Record<string, any>, column: IColumn, props: IListProps) {
  if (!column.fieldName) return null
  if (column.onRender) return column.onRender(item, undefined, column)
  if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
    return get(item, column['fieldNameDisplay'], null)
  }
  const columnValue = item[column.fieldName]
  const dataTypeProperties = new Map<string, any>(
    Object.entries(column.data?.dataTypeProperties ?? {})
  )
  if (!columnValue) {
    return dataTypeProperties.get('fallbackValue') ?? null
  }

  switch (column.fieldName) {
    case 'Title': {
      return (
        <TitleColumn
          item={item}
          renderProjectInformationPanel={true}
          webPartContext={props.webPartContext}
        />
      )
    }
  }

  const renderFunction = renderDataTypeMap[column['dataType']]

  if (renderFunction) {
    const renderProps: IRenderItemColumnProps = {
      column,
      item,
      columnValue,
      dataTypeProperties
    }
    return renderFunction(renderProps)
  }

  const config = column['config'] ? column['config'][columnValue] : null

  if (config) {
    const element: JSX.Element = (
      <span>
        <Icon iconName={config.iconName} style={{ color: config.color, marginRight: 4 }} />
        <span>{columnValue}</span>
      </span>
    )

    const tooltipValue: string =
      config.tooltipColumnPropertyName && item[config.tooltipColumnPropertyName]

    if (!stringIsNullOrEmpty(tooltipValue)) {
      return (
        <TooltipHost content={tooltipValue} calloutProps={{ gapSpace: 0 }}>
          {element}
        </TooltipHost>
      )
    }
    return element
  }
  return <span>{columnValue}</span>
}

/**
 * Render function for an item column.
 *
 * @param props Props for the component `PortfolioOverview`
 */
export const onRenderItemColumn =
  (props: IListProps) =>
  (item?: any, _index?: number, column?: IColumn): React.ReactNode => {
    return renderItemColumn(item, column, props)
  }
