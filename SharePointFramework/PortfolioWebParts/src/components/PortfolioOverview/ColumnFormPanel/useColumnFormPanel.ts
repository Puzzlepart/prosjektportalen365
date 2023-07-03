import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn, SPProjectColumnItem } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { COLUMN_FORM_PANEL_ON_SAVED, DELETE_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import _ from 'lodash'

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

/**
 * Component logic hook for `ColumnFormPanel`. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving columns to the list.
 */
export function useColumnFormPanel() {
  const context = useContext(PortfolioOverviewContext)
  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)
  const isEditing = !!context.state.columnForm.column

  useEffect(() => {
    if (isEditing) {
      $setColumn(context.state.columnForm.column)
    } else {
      $setColumn(initialColumn)
    }
  }, [context.state.columnForm])

  /**
   * Dismisses the form panel and resets the column state.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the column to the list. If the column is new, it will
   * also add the column to the current view. If the column is
   * being edited, it will update the column in the list.
   */
  const onSave = async () => {
    const colummData = column.get('data') ?? {}
    const columnItem: SPProjectColumnItem = {
      GtSortOrder: column.get('sortOrder'),
      Title: column.get('name'),
      GtInternalName: column.get('internalName'),
      GtManagedProperty: column.get('fieldName'),
      GtFieldDataType: colummData.renderAs ?? 'Text',
      GtColMinWidth: column.get('minWidth'),
      GtShowFieldFrontpage: colummData.visibility.includes('Frontpage'),
      GtShowFieldPortfolio: colummData.visibility.includes('Portfolio'),
      GtShowFieldProjectStatus: colummData.visibility.includes('ProjectStatus'),
      GtIsGroupable: colummData.isGroupable,
      GtIsRefinable: column.get('isRefinable')
    }
    if (isEditing) {
      const id = column.get('id')
      await context.props.dataAdapter.updateItemInList(
        strings.ProjectColumnsListName,
        id,
        _.omit(columnItem, ['GtInternalName', 'GtManagedProperty'])
      )
    } else {
      await context.props.dataAdapter.addColumnToPortfolioView(
        columnItem,
        context.state.currentView
      )
    }
    context.dispatch(
      COLUMN_FORM_PANEL_ON_SAVED({
        column: new ProjectColumn(columnItem),
        isNew: !isEditing
      })
    )
  }

  /**
   * Deletes the column from the columns list.
   */
  const onDeleteColumn = async () => {
    const columnId = column.get('id')
    const isDeleted = await context.props.dataAdapter.deleteItemFromList(
      strings.ProjectColumnsListName,
      columnId
    )
    if (!isDeleted) {
      context.dispatch(
        DELETE_COLUMN({
          columnId
        })
      )
    }
  }

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

  /**
   * Save is disabled if the column name or field name is less than 2 characters.
   */
  const isSaveDisabled = column.get('fieldName').length < 2 || column.get('name').length < 2

  return {
    onSave,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    isEditing,
    isSaveDisabled,
    onDeleteColumn
  } as const
}
