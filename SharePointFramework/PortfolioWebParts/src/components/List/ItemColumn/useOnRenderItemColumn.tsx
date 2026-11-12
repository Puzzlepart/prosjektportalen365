import { stringIsNullOrEmpty } from '@pnp/core'
import {
  ProjectColumnConfigDictionaryItem,
  getObjectValue as get,
  ColumnRenderComponentRegistry,
  IListColumn,
  IRenderItemColumnProps,
  useColumnRenderComponentRegistry
} from 'pp365-shared-library'
import React, { ReactNode, createElement, useMemo, useEffect } from 'react'
import { ConfigColumn } from './ConfigColumn'
import { TitleColumn } from './TitleColumn'
import { StatusReportColumn } from './StatusReportColumn'
import { ProjectInformationColumn } from './ProjectInformationColumn'
import { HubColumn } from './HubColumn'

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function. Also the `Title` column has a custom render
 * function by default that will be used as long as the `dataType` has not be changed to
 * something else than `text`.
 */
function renderItemColumn(item: Record<string, any>, column: IListColumn): ReactNode {
  if (!column.fieldName) return null
  if (column.onRender) return column.onRender(item, undefined, column)
  if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
    return get(item, column['fieldNameDisplay'], null)
  }
  const columnValue = item[column.fieldName]
  const dataTypeProperties: Record<string, any> = column.data?.dataTypeProperties ?? {}
  if (!columnValue && column.fieldName !== '-' && dataTypeProperties?.fallbackValue) {
    return dataTypeProperties.fallbackValue
  }

  if (column.fieldName === 'Title' && column['dataType'] === 'text') {
    return <TitleColumn item={item} />
  }

  const columnRenderProps: IRenderItemColumnProps = {
    item,
    column,
    columnValue,
    ...dataTypeProperties
  }

  const renderFunction = ColumnRenderComponentRegistry.getComponent(column['dataType'] as string)

  if (renderFunction) {
    return createElement(renderFunction, columnRenderProps)
  }

  const config = get<ProjectColumnConfigDictionaryItem>(column, 'data.config', null)
  const columnConfig = config && config[columnValue]

  if (columnConfig) {
    return <ConfigColumn {...columnRenderProps} {...columnConfig} />
  }

  return <span>{columnValue}</span>
}

/**
 * Register portfolio-specific cell types and return a stable renderer for list cells.
 */
export const useOnRenderItemColumn = () => {
  useColumnRenderComponentRegistry()
  useEffect(() => {
    ColumnRenderComponentRegistry.registerMultiple(
      StatusReportColumn,
      ProjectInformationColumn,
      HubColumn
    )
  }, [])

  return useMemo(
    () => (item?: any, _index?: number, column?: IListColumn) => renderItemColumn(item, column),
    []
  )
}
