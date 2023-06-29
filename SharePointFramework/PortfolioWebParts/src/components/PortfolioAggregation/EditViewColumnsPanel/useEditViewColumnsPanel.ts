import { IColumn } from '@fluentui/react'
import _ from 'lodash'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { useContext, useEffect, useState } from 'react'
import { OnDragEndResponder } from 'react-beautiful-dnd'
import { PortfolioAggregationContext } from '../context'
import { SET_COLUMNS, SHOW_HIDE_COLUMNS, TOGGLE_SHOW_HIDE_COLUMN_PANEL } from '../reducer'
import { IProjectContentColumn } from 'interfaces'

export function useEditViewColumnsPanel() {
  const context = useContext(PortfolioAggregationContext)
  const [isChanged, setIsChanged] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<IColumn[]>(context.state.columns)

  useEffect(() => {
    setSelectedColumns(context.state.columns)
  }, [context.state.columns])

  /**
   * On save event handler.
   */
  const onSave = async () => {
    context.dispatch(SET_COLUMNS({ columns: selectedColumns }))
    const columns = selectedColumns.filter((c) =>
      _.some(context.state.fltColumns, (_c) => c.fieldName === _c.fieldName)
    )

    const updateItems = {
      GtProjectContentColumnsId: columns.map((c) => c['id'])
    }

    await Promise.resolve(
      context.props.dataAdapter
        .updateDataSourceItem(updateItems, context.state.dataSource, true)
        .then(() => {
          context.dispatch(SHOW_HIDE_COLUMNS({ columns: selectedColumns }))
        })
        .catch((error) => (context.state.error = error))
    )
  }

  /**
   * On dismiss event handler.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_SHOW_HIDE_COLUMN_PANEL({ isOpen: false }))
  }

  /**
   * On change event handler.
   *
   * @param col Column item
   * @param checked Checked state
   */
  const onChange = (col: IColumn, checked: boolean) => {
    const items = selectedColumns.map((i) => {
      if (i.fieldName === col.fieldName) {
        return { ...i, selected: checked }
      }
      return i
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
  const moveColumn = (column: IProjectContentColumn, moveIndex: number) => {
    const columnIndex = selectedColumns.findIndex((c) => c.fieldName === column.fieldName)
    if (columnIndex > -1) {
      const _selectedColumns = arrayMove(
        selectedColumns,
        columnIndex,
        columnIndex + moveIndex
      )
      setSelectedColumns(_selectedColumns)
      setIsChanged(true)
    }
  }

  return {
    ...context,
    onDismiss,
    onDragEnd,
    selectedColumns,
    onChange,
    onSave,
    isChanged,
    moveColumn
  } as const
}
