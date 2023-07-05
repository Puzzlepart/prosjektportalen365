import { IColumn } from '@fluentui/react'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { useEffect, useState } from 'react'
import { OnDragEndResponder } from 'react-beautiful-dnd'
import { IEditViewColumnsPanelProps } from './types'

/**
 * Sorts columns based on `props.customColumnOrder` if set. The selected columns
 * will always be on top. The rest of the columns will be sorted based on their `sortOrder`
 * set in the corresponding list.
 *
 * @param props Props for `EditViewColumnsPanel` component
 */
const sortColumns = (props: IEditViewColumnsPanelProps) =>
  props.columns.sort((a, b) => {
    const customColumnOrderIndexA = props.customColumnOrder.indexOf(a['id'])
    const customColumnOrderIndexB = props.customColumnOrder.indexOf(b['id'])
    if (a.data.isSelected && !b.data.isSelected) {
      return -1
    } else if (!a.data.isSelected && b.data.isSelected) {
      return 1
    } else if (customColumnOrderIndexA !== -1 && customColumnOrderIndexB !== -1) {
      return customColumnOrderIndexA - customColumnOrderIndexB || a['sortOrder'] - b['sortOrder']
    } else if (customColumnOrderIndexA !== -1) {
      return -1
    } else if (customColumnOrderIndexB !== -1) {
      return 1
    } else {
      return a['sortOrder'] - b['sortOrder']
    }
  })

export function useEditViewColumnsPanel(props: IEditViewColumnsPanelProps) {
  const [isChanged, setIsChanged] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<IColumn[]>(props.columns ?? [])

  useEffect(() => {
    setSelectedColumns(sortColumns(props))
  }, [props.columns])

  /**
   * On save event handler.
   */
  const onSave = () => {
    const columns = selectedColumns.filter((c) => c.data.isSelected)
    props.onSave(columns)
  }

  /**
   * On change event handler.
   *
   * @param col Column item
   * @param isSelected Selected state
   */
  const onChange = (col: IColumn, isSelected: boolean) => {
    const items = selectedColumns.map((i) => {
      return i.fieldName === col.fieldName ? { ...i, data: { ...i.data, isSelected } } : i
    })
    setSelectedColumns(items)
    setIsChanged(true)
  }

  /**
   * On drag end event handler.
   *
   * @param result Drag and drop result
   */
  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) {
      return
    }
    const _selectedColumns = arrayMove(
      selectedColumns,
      result.source.index,
      result.destination.index
    )
    setSelectedColumns(_selectedColumns)
    setIsChanged(true)
  }

  /**
   * Move column.
   *
   * @param column Column item
   * @param moveIndex Move index
   */
  const moveColumn = (column: IColumn, moveIndex: number) => {
    const columnIndex = selectedColumns.findIndex((c) => c.fieldName === column.fieldName)
    if (columnIndex > -1) {
      const _selectedColumns = arrayMove(selectedColumns, columnIndex, columnIndex + moveIndex)
      setSelectedColumns(_selectedColumns)
      setIsChanged(true)
    }
  }

  return {
    onDragEnd,
    selectedColumns,
    onChange,
    onSave,
    isChanged,
    moveColumn
  } as const
}
