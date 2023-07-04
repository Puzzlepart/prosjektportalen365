import { Link, TooltipHost } from '@fluentui/react'

import { Icon } from '@fluentui/react/lib/Icon'
import { stringIsNullOrEmpty } from '@pnp/common'
import * as strings from 'PortfolioWebPartsStrings'
import { IFetchDataForViewItemResult } from 'data/types'
import { formatDate, tryParseCurrency } from 'pp365-shared-library/lib/helpers'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import React from 'react'
import { IPortfolioOverviewProps } from '../types'
import { TagsColumn } from './TagsColumn'
import { TitleColumn } from './TitleColumn'
import { UserColumn } from './UserColumn'
import { IRenderItemColumnProps } from './types'

type RenderDataType = 'user' | 'date' | 'currency' | 'tags' | 'boolean' | 'url'
type RenderFunction = (props: IRenderItemColumnProps) => JSX.Element

/**
 * Mapping for rendering of the different data types.
 */
const renderDataTypeMap: Record<RenderDataType, RenderFunction> = {
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
  tags: (props: IRenderItemColumnProps) => <TagsColumn {...props} />,
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
  }
}

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function. Also the `Title` column has a custom render
 * function by default and can not be overridden.
 *
 * @param item Item to render the value for
 * @param column Column to render the value for
 * @param props Props for the component
 */
function renderItemColumn(
  item: IFetchDataForViewItemResult,
  column: ProjectColumn,
  props: IPortfolioOverviewProps
) {
  const columnValue = item[column.fieldName]
  const dataTypeProperties = new Map(Object.entries(column.data?.dataTypeProperties ?? {}))
  if (!columnValue) {
    return dataTypeProperties.get('fallbackValue') ?? null
  }

  switch (column.fieldName) {
    case 'Title': {
      return <TitleColumn props={props} item={item} />
    }
  }

  if (renderDataTypeMap[column.dataType]) {
    return renderDataTypeMap[column.dataType]({
      column,
      columnValue,
      dataTypeProperties
    } as IRenderItemColumnProps)
  }

  const config = column.config ? column.config[columnValue] : null

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
  (props: IPortfolioOverviewProps) =>
  (item?: any, _index?: number, column?: ProjectColumn): React.ReactNode => {
    return renderItemColumn(item, column, props)
  }
