import { IListColumn, arrayMove } from 'pp365-shared-library'
import { useEffect, useMemo, useState } from 'react'
import { isSameColumn } from './columnIdentity'
import { EditViewColumnsPanelSortMode, IEditViewColumnsPanelProps } from './types'

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
        return sortMode === EditViewColumnsPanelSortMode.CustomSelectedOnTop
          ? a['sortOrder'] - b['sortOrder']
          : 0
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
  const initialColumns = useMemo(() => [...sortColumns(props)], [props.columns])
  const initialSelectedColumns = useMemo(
    () => initialColumns.filter((c) => c.data.isSelected),
    [initialColumns]
  )
  const [selectableColumns, setSelectableColumns] = useState<IListColumn[]>([])

  useEffect(() => {
    setSelectableColumns([...initialColumns])
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
   */
  function selectColumn(col: IListColumn, isSelected: boolean) {
    setSelectableColumns((_selectableColumns) =>
      _selectableColumns.map((c) => {
        if (!isSameColumn(c, col)) return c
        // A copy of the column's own class: the overviews call its methods afterwards (a view's
        // `configure` calls `isVisible`), which a spread copy did not have.
        return Object.assign(Object.create(Object.getPrototypeOf(c)), c, {
          data: {
            ...c.data,
            isSelected
          }
        }) as IListColumn
      })
    )
  }

  /**
   * Moves a column from one index to another in the `selectableColumns` state.
   *
   * @param fromIndex The index of the column to move.
   * @param toIndex The index to move the column to.
   */
  function moveColumn(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    setSelectableColumns((_selectableColumns) => arrayMove(_selectableColumns, fromIndex, toIndex))
  }

  /**
   * Moves a selected column one step up or down among the selected columns, the order the view
   * saves, to the place of the selected column next to it. The columns that are not selected keep
   * their order.
   *
   * @param col The column to move.
   * @param step `-1` to move it up, `1` to move it down.
   */
  function moveSelectedColumn(col: IListColumn, step: -1 | 1) {
    setSelectableColumns((_selectableColumns) => {
      const selected = _selectableColumns.filter((c) => c.data.isSelected)
      const position = selected.findIndex((c) => isSameColumn(c, col))
      const neighbour = position === -1 ? undefined : selected[position + step]
      if (!neighbour) return _selectableColumns
      return arrayMove(
        _selectableColumns,
        _selectableColumns.findIndex((c) => isSameColumn(c, col)),
        _selectableColumns.findIndex((c) => isSameColumn(c, neighbour))
      )
    })
  }

  return {
    initialSelectedColumns,
    selectableColumns,
    selectedColumns,
    selectColumn,
    moveColumn,
    moveSelectedColumn
  }
}
