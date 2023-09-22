import _ from 'lodash'
import { IPortfolioAggregationProps } from '../types'
import { ProjectContentColumn } from 'pp365-shared-library'

/**
 * Persist columns in web part properties for `<PortfolioAggregation />` component
 * using the `onUpdateProperty` callback and property key `columns`.
 *
 * By default the following properties for the columns are persisted:
 * - `id`
 * - `sortOrder`
 * - `key`
 * - `fieldName`
 * - `internalName`
 * - `name`
 * - `minWidth`
 * - `maxWidth`
 * - `data`
 *
 * @param props Props for `<PortfolioAggregation />` component
 * @param columns Columns to persist to property `columns`
 * @param properties Properties to pick from `columns` object before persisting to web part properties
 */
export function persistSelectedColumnsInWebPartProperties(
  { onUpdateProperty }: IPortfolioAggregationProps,
  columns: ProjectContentColumn[],
  properties: string[] = [
    'id',
    'sortOrder',
    'key',
    'fieldName',
    'internalName',
    'name',
    'minWidth',
    'maxWidth',
    'data'
  ]
) {
  const selectedColumns = columns.filter((col) => col.data?.isSelected)
  onUpdateProperty(
    'columns',
    selectedColumns.map((col) => _.pick(col, properties))
  )
}
