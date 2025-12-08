import { IColumn } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import { getObjectValue as get } from '../../util'
import React, { ReactNode, createElement, useMemo } from 'react'
import { ColumnRenderComponentRegistry, useColumnRenderComponentRegistry } from './registry'
import { IRenderItemColumnProps } from './types'

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function based on the dataType.
 *
 * @param item Item to render the value for
 * @param column Column to render the value for
 */
export function renderItemColumn(item: Record<string, any>, column: IColumn): ReactNode {
  if (!column.fieldName) return null
  if (column.onRender) return column.onRender(item, undefined, column)
  if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
    return get(item, column['fieldNameDisplay'], null)
  }
  const columnValue = item[column.fieldName]
  const dataTypeProperties: Record<string, any> = column.data?.dataTypeProperties ?? {}

  // Handle fallback value
  if (!columnValue && column.fieldName !== '-' && dataTypeProperties?.fallbackValue) {
    return dataTypeProperties.fallbackValue
  }

  const columnRenderProps: IRenderItemColumnProps = {
    item,
    column,
    columnValue,
    ...dataTypeProperties
  }

  // Get the data type from column
  const dataType = column['dataType'] || column.data?.type || column.data?.renderAs

  const renderFunction = ColumnRenderComponentRegistry.getComponent(dataType as string)

  if (renderFunction) {
    return createElement(renderFunction, columnRenderProps)
  }

  // Default rendering for unknown types
  if (columnValue === null || columnValue === undefined) {
    return <>-</>
  }

  return <span>{String(columnValue)}</span>
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
