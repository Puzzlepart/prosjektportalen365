import { IColumn } from '@fluentui/react'
import { IProjectContentColumn } from 'interfaces'
import _ from 'lodash'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { useContext, useEffect, useState } from 'react'
import { OnDragEndResponder } from 'react-beautiful-dnd'
import { IPortfolioOverviewContext, PortfolioOverviewContext } from '../context'
import { TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from '../reducer'
import strings from 'PortfolioWebPartsStrings'

/**
 * Get all columns from `context.props.configuration.columns` with the selected state
 * based on the `context.state.columns`.
 *
 * @param context Context
 */
function getColumnsWithSelectedState(context: IPortfolioOverviewContext) {
  return context.props.configuration.columns.map((c) => ({
    ...c,
    data: {
      ...c.data,
      selected: _.some(context.state.columns, (_c) => _c.fieldName === c.fieldName)
    }
  }))
}

export function useEditViewColumnsPanel() {
  const context = useContext(PortfolioOverviewContext)
  const [isChanged, setIsChanged] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<IProjectContentColumn[]>(
    getColumnsWithSelectedState(context)
  )

  useEffect(() => {
    setSelectedColumns(getColumnsWithSelectedState(context))
  }, [context.state.columns])

  /**
   * On save event handler.
   */
  const onSave = async () => {
    const columns = selectedColumns.filter((c) => c.data.selected)

    const properties: Record<string, any> = {
      GtPortfolioColumnsId: {
        results: columns.map((c) => c.id)
      },
      GtPortfolioColumnOrder: JSON.stringify(columns.map((c) => c.id))
    }

    await context.props.dataAdapter.updateItemInList(
      strings.PortfolioViewsListName,
      context.state.currentView.id as any,
      properties
    )

    context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns }))
  }

  /**
   * On dismiss event handler.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false }))
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
  const moveColumn = (column: IProjectContentColumn, moveIndex: number) => {
    const columnIndex = selectedColumns.findIndex((c) => c.fieldName === column.fieldName)
    if (columnIndex > -1) {
      const _selectedColumns = arrayMove(selectedColumns, columnIndex, columnIndex + moveIndex)
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
