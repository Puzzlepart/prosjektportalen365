import { IColumn } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { useContext, useEffect, useState } from 'react'
import { OnDragEndResponder } from 'react-beautiful-dnd'
import { IPortfolioOverviewContext, PortfolioOverviewContext } from '../context'
import { TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from '../reducer'
import { IProjectColumn } from 'pp365-shared-library'

/**
 * Get all columns from `context.props.configuration.columns` with the selected state
 * based on the `context.state.columns`.
 *
 * @param context Context
 */
function getColumnsWithSelectedState(context: IPortfolioOverviewContext): any[] {
  return context.props.configuration.columns
    .map((c) => ({
      ...c,
      data: {
        ...c.data,
        selected: _.some(context.state.columns, (_c) => _c.fieldName === c.fieldName)
      }
    }))
    .sort((a, b) => {
      const customColumnOrder = context.state?.currentView?.columnOrder ?? []
      const customColumnOrderIndexA = customColumnOrder.indexOf(a.id)
      const customColumnOrderIndexB = customColumnOrder.indexOf(b.id)
      if (a.data.selected && !b.data.selected) {
        return -1
      } else if (!a.data.selected && b.data.selected) {
        return 1
      } else if (customColumnOrderIndexA !== -1 && customColumnOrderIndexB !== -1) {
        return customColumnOrderIndexA - customColumnOrderIndexB || a.sortOrder - b.sortOrder
      } else if (customColumnOrderIndexA !== -1) {
        return -1
      } else if (customColumnOrderIndexB !== -1) {
        return 1
      } else {
        return a.sortOrder - b.sortOrder
      }
    })
}

export function useEditViewColumnsPanel() {
  const context = useContext(PortfolioOverviewContext)
  const [isChanged, setIsChanged] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState(getColumnsWithSelectedState(context))

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
   * On revert custom order event handler.
   */
  const onRevertCustomOrder = async () => {
    const columns = selectedColumns
      .filter((c) => c.data.selected)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const properties: Record<string, any> = {
      GtPortfolioColumnOrder: null
    }

    await context.props.dataAdapter.updateItemInList(
      strings.PortfolioViewsListName,
      context.state.currentView.id as any,
      properties
    )

    context.dispatch(
      TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns, revertColumnOrder: true })
    )
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
  const moveColumn = (column: IProjectColumn, moveIndex: number) => {
    const columnIndex = selectedColumns.findIndex((c) => c.fieldName === column.fieldName)
    if (columnIndex > -1) {
      const _selectedColumns = arrayMove(selectedColumns, columnIndex, columnIndex + moveIndex)
      setSelectedColumns(_selectedColumns)
      setIsChanged(true)
    }
  }

  return {
    onDismiss,
    onDragEnd,
    selectedColumns,
    onChange,
    onSave,
    onRevertCustomOrder,
    isChanged,
    moveColumn
  } as const
}
