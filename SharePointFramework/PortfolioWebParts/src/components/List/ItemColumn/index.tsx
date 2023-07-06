import { IColumn, Icon, TooltipHost } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import {
  ColumnDataType,
  ProjectColumnConfigDictionaryItem,
  formatDate,
  getObjectValue as get,
  tryParseJson
} from 'pp365-shared-library'
import React from 'react'
import { IListProps } from '../types'
import { BooleanColumn } from './BooleanColumn'
import { CurrencyColumn } from './CurrencyColumn'
import { FileNameColumn } from './FileNameColumn'
import { ListColumn } from './ListColumn'
import { ModalColumn } from './ModalColumn'
import { TagsColumn } from './TagsColumn'
import { TitleColumn } from './TitleColumn'
import { TrendColumn } from './TrendColumn'
import { UrlColumn } from './UrlColumn'
import { UserColumn } from './UserColumn'
import { ItemColumnRenderFunction } from './types'

/**
 * Mapping for rendering of the different data types.
 */
const renderDataTypeMap: Record<ColumnDataType, ItemColumnRenderFunction> = {
  text: null,
  note: null,
  user: (props) => <UserColumn {...props} />,
  date: (props) => {
    const includeTime = props.dataTypeProperties.get('includeTime') ?? false
    return <span>{formatDate(props.columnValue, includeTime)}</span>
  },
  currency: (props) => (
    <CurrencyColumn
      {...props}
      currencyPrefix={props.dataTypeProperties.get('currencyPrefix')}
      minimumFractionDigits={props.dataTypeProperties.get('minimumFractionDigits')}
      maximumFractionDigits={props.dataTypeProperties.get('maximumFractionDigits')}
    />
  ),
  tags: (props) => (
    <TagsColumn {...props} valueSeparator={props.dataTypeProperties.get('valueSeparator')} />
  ),
  boolean: (props) => (
    <BooleanColumn
      {...props}
      valueIfTrue={props.dataTypeProperties.get('valueIfTrue')}
      valueIfFalse={props.dataTypeProperties.get('valueIfFalse')}
    />
  ),
  url: (props) => (
    <UrlColumn
      {...props}
      openInNewTab={props.dataTypeProperties.get('openInNewTab')}
      description={props.dataTypeProperties.get('description')}
    />
  ),
  trend: (props) => <TrendColumn {...props} />,
  modal: (props) => (
    <ModalColumn
      {...props}
      header={{
        title: get(props.item, props.dataTypeProperties.get('headerTitleField')),
        subTitle: get(props.item, props.dataTypeProperties.get('headerSubTitleField'))
      }}
      showInfoText={props.dataTypeProperties.get('showInfoText')}
      infoTextTemplate={props.dataTypeProperties.get('infoTextTemplate')}
      linkText={props.dataTypeProperties.get('linkText')}
      items={JSON.parse(props.columnValue)}
      columns={tryParseJson(props.dataTypeProperties.get('columns'), undefined)}
    />
  ),
  filename: (props) => <FileNameColumn {...props} showFileExtensionIcon />,
  list: (props) => <ListColumn {...props} />
}

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function. Also the `Title` column has a custom render
 * function by default that will be used as long as the `dataType` has not be changed to
 * something else than `text`.
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

  if (column.fieldName === 'Title' && column['dataType'] === 'text') {
    return (
      <TitleColumn
        item={item}
        renderProjectInformationPanel={props.renderTitleProjectInformationPanel}
        webPartContext={props.webPartContext}
      />
    )
  }

  const renderFunction: ItemColumnRenderFunction = renderDataTypeMap[column['dataType']]

  if (renderFunction) {
    return renderFunction({
      column,
      item,
      columnValue,
      dataTypeProperties
    })
  }

  const config = get<ProjectColumnConfigDictionaryItem>(column, `data.config.${columnValue}`, null)

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

export {
  BooleanColumn,
  CurrencyColumn,
  FileNameColumn,
  ListColumn,
  ModalColumn,
  TagsColumn,
  TitleColumn,
  TrendColumn,
  UrlColumn,
  UserColumn
}
