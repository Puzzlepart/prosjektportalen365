import { IColumn } from '@fluentui/react'
import { useEffect, useMemo, useState } from 'react'
import { IEditViewColumnsPanelProps } from './types'
import { arrayMove } from 'pp365-shared-library'
import _ from 'lodash'

/**
 * Sorts columns based on `props.customColumnOrder` if set. The selected columns
 * will always be on top. The rest of the columns will be sorted based on their `sortOrder`
 * set in the corresponding list.
 *
 * @param props Props for `EditViewColumnsPanel` component
 */
function sortColumns({ columns, customColumnOrder, sortMode }: IEditViewColumnsPanelProps) {
  return [...columns]
    .filter((c) => (c.data?.visibility ? c.data.visibility.includes('Portfolio') : true))
    .sort((a, b) => {
      const columnOrderA = customColumnOrder.indexOf(a['id'])
      const customColumnOrderIndexB = customColumnOrder.indexOf(b['id'])
      if (a.data.isSelected && !b.data.isSelected) {
        return -1
      } else if (!a.data.isSelected && b.data.isSelected) {
        return 1
      } else if (columnOrderA !== -1 && customColumnOrderIndexB !== -1) {
        return columnOrderA - customColumnOrderIndexB || a['sortOrder'] - b['sortOrder']
      } else if (columnOrderA !== -1) {
        return -1
      } else if (customColumnOrderIndexB !== -1) {
        return 1
      } else {
        return sortMode === 'customSelectedOnTop' ? a['sortOrder'] - b['sortOrder'] : 0
      }
    })
}

/**
 * Hook that returns selectable columns and selected columns based on the props.
 *
 * @param props Props for `EditViewColumnsPanel` component
 *
 * @returns An object containing the initial columns, selectable columns, selected columns,
 * and functions to update the selectable columns and moving them around.
 */
export function useSelectableColumns(props: IEditViewColumnsPanelProps) {
  const initialColumns = useMemo(() => sortColumns(props), [props.columns])
  const initialSelectedColumns = useMemo(
    () => initialColumns.filter((c) => c.data.isSelected),
    [initialColumns]
  )
  const [selectableColumns, setSelectableColumns] = useState<IColumn[]>([])

  useEffect(() => {
    setSelectableColumns(initialColumns)
  }, [initialColumns])

  const selectedColumns = useMemo(
    () => selectableColumns.filter((c) => c.data.isSelected),
    [selectableColumns]
  )

  /**
   * Updates the `isSelected` property of a column in the `selectableColumns` state.
   *
   * @param col The column to update.
   * @param isSelected The new value for the `isSelected` property.
   * @param idx The index of the column in the `selectableColumns` state.
   */
  function selectColumn(col: IColumn, isSelected: boolean, idx: number) {
    setSelectableColumns((prev) =>
      prev.map((i) => (i.fieldName === col.fieldName ? _.set(i, 'data.isSelected', isSelected) : i))
    )

    moveColumn(idx, isSelected ? selectedColumns.length : selectedColumns.length - 1)
  }

  /**
   * Moves a column from one index to another in the `selectableColumns` state.
   *
   * @param fromIndex The index of the column to move.
   * @param toIndex The index to move the column to.
   */
  function moveColumn(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    setSelectableColumns((prev) => arrayMove(prev, fromIndex, toIndex))
  }

  return {
    initialSelectedColumns,
    selectableColumns,
    selectedColumns,
    selectColumn,
    moveColumn
  } as const
}
