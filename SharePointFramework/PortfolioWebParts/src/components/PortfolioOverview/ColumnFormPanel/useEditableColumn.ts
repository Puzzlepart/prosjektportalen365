import { ProjectColumn } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'

type EditableColumn = Map<string, any>

/**
 * Intial column with default values.
 */
const initialColumn = new Map<string, any>([
  ['name', ''],
  ['internalName', ''],
  ['fieldName', ''],
  ['sortOrder', 100],
  ['minWidth', 100],
  [
    'data',
    {
      visibility: []
    }
  ]
])

const convertToMap = (column: ProjectColumn): EditableColumn => {
  return new Map<string, any>([
    ['id', column.id],
    ['key', column.key],
    ['fieldName', column.fieldName],
    ['name', column.name],
    ['minWidth', column.minWidth],
    ['sortOrder', column.sortOrder],
    ['internalName', column.internalName],
    ['iconName', column.iconName],
    ['dataType', column.dataType],
    ['isRefinable', column.isRefinable],
    ['data', column.data]
  ])
}

export function useEditableColumn() {
  const context = useContext(PortfolioOverviewContext)
  const [column, $setColumn] = useState<EditableColumn>(initialColumn)
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
