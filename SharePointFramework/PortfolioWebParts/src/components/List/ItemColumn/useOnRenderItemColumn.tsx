import { IColumn } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import { ProjectColumnConfigDictionaryItem, getObjectValue as get } from 'pp365-shared-library'
import React, { ReactNode, createElement, useMemo } from 'react'
import { IListProps } from '../types'
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
 * @param props Props for the component `<List />`
 */
function renderItemColumn(
  item: Record<string, any>,
  column: IColumn,
  props: IListProps
): ReactNode {
  if (!column.fieldName) return null
  if (column.onRender) return column.onRender(item, undefined, column)
  if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
    return get(item, column['fieldNameDisplay'], null)
  }
  const columnValue = item[column.fieldName]
  const dataTypeProperties: Record<string, any> = column.data?.dataTypeProperties ?? {}
  if (!columnValue) {
    return dataTypeProperties.fallbackValue ?? null
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

  const config = get<ProjectColumnConfigDictionaryItem>(column, `data.config.${columnValue}`, null)

  if (config) {
    return <ConfigColumn {...columnRenderProps} {...config} />
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
export const useOnRenderItemColumn = (props: IListProps) => {
  useColumnRenderComponentRegistry()
  return useMemo(
    () => (item?: any, _index?: number, column?: IColumn) => renderItemColumn(item, column, props),
    [props]
  )
}
