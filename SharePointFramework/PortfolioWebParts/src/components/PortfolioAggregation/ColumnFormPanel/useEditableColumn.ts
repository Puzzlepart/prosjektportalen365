import { ProjectContentColumn } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'

/**
 * Intial column with default values.
 */
const initialColumn = new Map<string, any>([
  ['name', ''],
  ['internalName', ''],
  ['fieldName', ''],
  ['sortOrder', 100],
  ['minWidth', 100],
  ['maxWidth', 150],
  ['data', {}]
])

const convertToMap = (column: ProjectContentColumn) => {
  return new Map<string, any>([
    ['id', column.id],
    ['key', column.key],
    ['fieldName', column.fieldName],
    ['name', column.name],
    ['minWidth', column.minWidth],
    ['maxWidth', column.maxWidth],
    ['sortOrder', column.sortOrder],
    ['internalName', column.internalName],
    ['iconName', column.iconName],
    ['dataType', column.dataType],
    ['data', column.data]
  ])
}

export function useEditableColumn() {
  const context = useContext(PortfolioAggregationContext)
  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)
  const isEditing = !!context.state.columnForm.column

  useEffect(() => {
    if (isEditing) {
      $setColumn(convertToMap(context.state.columnForm.column))
    } else {
      $setColumn(initialColumn)
    }
  }, [context.state.columnForm])

  /**
   * Sets a property of the column.
   *
   * @param key Key of the column to update
   * @param value Value to update the column with
   */
  const setColumn = (key: string, value: any) => {
    $setColumn((prev) => {
      const newColumn = new Map(prev)
      newColumn.set(key, value)
      return newColumn
    })
  }

  /**
   * Set the data object of the column.
   *
   * @param key Key of the data object to update
   * @param value Value to update the data object with
   */
  const setColumnData = (key: string, value: any) => {
    $setColumn((prev) => {
      const newColumn = new Map(prev)
      const data = newColumn.get('data')
      newColumn.set('data', {
        ...data,
        [key]: value
      })
      return newColumn
    })
  }

  return {
    column,
    setColumn,
    setColumnData,
    isEditing
  } as const
}
