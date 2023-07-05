import { IColumn } from '@fluentui/react'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { useEffect, useState } from 'react'
import { OnDragEndResponder } from 'react-beautiful-dnd'
import { IEditViewColumnsPanelProps } from './types'

export function useEditViewColumnsPanel(props: IEditViewColumnsPanelProps) {
  const [isChanged, setIsChanged] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<IColumn[]>(props.columns ?? [])

  useEffect(() => {
    setSelectedColumns(props.columns ?? [])
  }, [props.columns])

  /**
   * On save event handler.
   */
  const onSave = () => {
    const columns = selectedColumns.filter((c) => c.data.selected)
    props.onSave(columns)
  }

  /**
   * On change event handler.
   *
   * @param col Column item
   * @param selected Selected state
   */
  const onChange = (col: IColumn, checked: boolean) => {
    const items = selectedColumns.map((i) => {
      return i.fieldName === col.fieldName ? { ...i, data: { ...i.data, selected: checked } } : i
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
