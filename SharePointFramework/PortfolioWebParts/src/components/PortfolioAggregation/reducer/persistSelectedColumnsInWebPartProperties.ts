import _ from 'lodash'
import { IPortfolioAggregationProps } from '../types'
import { ProjectContentColumn } from 'pp365-shared-library'

/**
 * Persist selected columns through the web part's `columns` property, keeping only chosen fields.
 *
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
