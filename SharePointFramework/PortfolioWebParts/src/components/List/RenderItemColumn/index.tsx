import { IColumn, TooltipHost } from '@fluentui/react'

import { Icon } from '@fluentui/react/lib/Icon'
import { stringIsNullOrEmpty } from '@pnp/common'
import { ColumnDataType, formatDate, getObjectValue as get } from 'pp365-shared-library'
import React from 'react'
import ItemModal from '../ItemModal'
import { IListProps } from '../types'
import { BooleanColumn } from './BooleanColumn'
import { CurrencyColumn } from './CurrencyColumn'
import { TagsColumn } from './TagsColumn'
import { TitleColumn } from './TitleColumn'
import { TrendColumn } from './TrendColumn'
import { UrlColumn } from './UrlColumn'
import { UserColumn } from './UserColumn'
import { IRenderItemColumnProps, ItemRenderFunction } from './types'
import { FileNameColumn } from './FileNameColumn'

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
  currency: (props: IRenderItemColumnProps) => (
    <CurrencyColumn
      {...props}
      currencyPrefix={props.dataTypeProperties.get('currencyPrefix')}
      minimumFractionDigits={props.dataTypeProperties.get('minimumFractionDigits')}
      maximumFractionDigits={props.dataTypeProperties.get('maximumFractionDigits')}
    />
  ),
  tags: (props: IRenderItemColumnProps) => (
    <TagsColumn {...props} valueSeparator={props.dataTypeProperties.get('valueSeparator')} />
  ),
  boolean: (props: IRenderItemColumnProps) => (
    <BooleanColumn
      {...props}
      valueIfTrue={props.dataTypeProperties.get('valueIfTrue')}
      valueIfFalse={props.dataTypeProperties.get('valueIfFalse')}
    />
  ),
  url: (props: IRenderItemColumnProps) => (
    <UrlColumn
      {...props}
      openInNewTab={props.dataTypeProperties.get('openInNewTab')}
      description={props.dataTypeProperties.get('description')}
    />
  ),
  trend: (props: IRenderItemColumnProps) => <TrendColumn {...props} />,
  modal: (props: IRenderItemColumnProps) => (
    <ItemModal title={props.item.MeasurementIndicator} value={JSON.parse(props.columnValue)} />
  ),
  filename_with_icon: (props: IRenderItemColumnProps) => (
    <FileNameColumn {...props} showFileExtensionIcon />
  )
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
