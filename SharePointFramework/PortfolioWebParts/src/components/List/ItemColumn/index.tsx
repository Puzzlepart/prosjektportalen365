import { IColumn, Icon, TooltipHost } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import {
  ColumnDataType,
  ProjectColumnConfigDictionaryItem,
  getObjectValue as get,
  tryParseJson
} from 'pp365-shared-library'
import React, { useMemo } from 'react'
import { IColumnDataTypeFieldOption } from '../../ColumnDataTypeField/types'
import { IListProps } from '../types'
import { BooleanColumn } from './BooleanColumn'
import { CurrencyColumn } from './CurrencyColumn'
import { DateColumn } from './DateColumn'
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
  date: (props) => (
    <DateColumn {...props} includeTime={props.dataTypeProperties.get('includeTime')} />
  ),
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
 * Get column data type options that doesn't have a render component.
 *
 * For now this is the following data types:
 *
 * - `text`
 * - `note`
 * - `number`
 * - `datetime`
 * - `percentage`
 */
export const getColumnDataTypeOptionsWithoutRenderComponent = (): IColumnDataTypeFieldOption[] => {
  return [
    {
      key: 'text',
      id: 'Text',
      text: strings.ColumnRenderOptionText,
      data: { iconProps: { iconName: 'FontColor' } }
    },
    {
      key: 'note',
      id: 'Note',
      text: strings.ColumnRenderOptionNote,
      data: { iconProps: { iconName: 'EditStyle' } }
    },
    {
      key: 'number',
      id: 'Number',
      text: strings.ColumnRenderOptionNumber,
      data: { iconProps: { iconName: 'NumberedList' } }
    },
    {
      key: 'datetime',
      id: 'DateTime',
      text: strings.ColumnRenderOptionDateTime,
      data: {
        iconProps: { iconName: 'DateTime' }
      }
    },
    {
      key: 'percentage',
      id: 'Percentage',
      text: strings.ColumnRenderOptionPercentage,
      data: { iconProps: { iconName: 'CalculatorPercentage' } }
    }
  ]
}

export const useOnRenderItemColumn = (props: IListProps) =>
  useMemo(
    () =>
      (item?: any, _index?: number, column?: IColumn): React.ReactNode => {
        return renderItemColumn(item, column, props)
      },
    [props]
  )

export {
  BooleanColumn,
  CurrencyColumn,
  DateColumn,
  FileNameColumn,
  ListColumn,
  ModalColumn,
  TagsColumn,
  TitleColumn,
  TrendColumn,
  UrlColumn,
  UserColumn
}
