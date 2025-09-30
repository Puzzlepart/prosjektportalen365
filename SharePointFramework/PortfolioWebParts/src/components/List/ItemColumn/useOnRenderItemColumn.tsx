import { IColumn } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import { ProjectColumnConfigDictionaryItem, getObjectValue as get } from 'pp365-shared-library'
import React, { ReactNode, createElement, useMemo } from 'react'
import { ConfigColumn } from './ConfigColumn'
import { TitleColumn } from './TitleColumn'
import { ColumnRenderComponentRegistry, useColumnRenderComponentRegistry } from './registry'
import { IRenderItemColumnProps } from './types'

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function. Also the `Title` column has a custom render
 * function by default that will be used as long as the `dataType` has not be changed to
 * something else than `text`.
 *
 * @param item Item to render the value for
 * @param column Column to render the value for
 */
function renderItemColumn(item: Record<string, any>, column: IColumn): ReactNode {
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
 * Hook for handling the `onRenderItemColumn` function.
 * Returns an instance of the function `onRenderItemColumn`,
 * that only changes when the `props` changes. Also  registers
 * column render options for data types that doesn't have a custom
 * render component.
 */
export const useOnRenderItemColumn = () => {
  useColumnRenderComponentRegistry()
  return useMemo(
    () => (item?: any, _index?: number, column?: IColumn) => renderItemColumn(item, column),
    []
  )
}
