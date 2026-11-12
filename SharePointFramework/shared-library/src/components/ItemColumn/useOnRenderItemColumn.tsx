import { stringIsNullOrEmpty } from '@pnp/core'
import { getObjectValue as get } from '../../util'
import React, { ReactNode, createElement, useMemo } from 'react'
import { ColumnRenderComponentRegistry, useColumnRenderComponentRegistry } from './registry'
import { IRenderItemColumnProps } from './types'
import { IListColumn } from '../../types'

/**
 * Renders a field-backed column using its custom renderer, display field or registered data type.
 */
export function renderItemColumn(item: Record<string, any>, column: IListColumn): ReactNode {
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

  const columnRenderProps: IRenderItemColumnProps = {
    item,
    column,
    columnValue,
    ...dataTypeProperties
  }

  const dataType = column['dataType'] || column.data?.type || column.data?.renderAs

  const renderFunction = ColumnRenderComponentRegistry.getComponent(dataType as string)

  if (renderFunction) {
    return createElement(renderFunction, columnRenderProps)
  }

  if (columnValue === null || columnValue === undefined) {
    return <>-</>
  }

  return <span>{String(columnValue)}</span>
}

/**
 * Registers shared renderers and supplies a stable list-cell rendering callback.
 */
export const useOnRenderItemColumn = () => {
  useColumnRenderComponentRegistry()
  return useMemo(
    () => (item?: any, _index?: number, column?: IListColumn) => renderItemColumn(item, column),
    []
  )
}
