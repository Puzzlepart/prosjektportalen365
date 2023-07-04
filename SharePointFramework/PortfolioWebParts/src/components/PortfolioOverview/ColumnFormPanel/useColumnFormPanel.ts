import { format } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import _ from 'lodash'
import { ProjectColumn, SPProjectColumnItem } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { COLUMN_DELETED, COLUMN_FORM_PANEL_ON_SAVED, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import strings from 'PortfolioWebPartsStrings'

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
  const [columnMessages, setColumnMessages] = useState<Map<string, string>>(new Map())
  const isEditing = !!context.state.columnForm.column

  useEffect(() => {
    if (isEditing) {
      $setColumn(context.state.columnForm.column.$map)
    } else {
      $setColumn(initialColumn)
    }
  }, [context.state.columnForm])

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_COLUMN_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the column to the list. If the column is new, it will
   * also add the column to the current view. If the column is
   * being edited, it will update the column in the list.
   *
   * If the column is being edited, it will update the column in the list
   * using `updateItemInList` from the `dataAdapter`. If the column is new,
   * it will add the column to the list using `addColumnToPortfolioView` from
   * the `dataAdapter`.
   */
  const onSave = async () => {
    const colummData = column.get('data') ?? {}
    const columnItem: SPProjectColumnItem = {
      Id: column.get('id'),
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
    if (colummData.dataTypeProperties) {
      columnItem.GtFieldDataTypeProperties = JSON.stringify(colummData.dataTypeProperties, null, 2)
    }
    if (isEditing) {
      await context.props.dataAdapter.portalDataService.updateItemInList(
        'PROJECT_COLUMNS',
        context.state.columnForm.column.id,
        _.omit(columnItem, ['Id', 'GtInternalName', 'GtManagedProperty'])
      )
    } else {
      await context.props.dataAdapter.addColumnToPortfolioView(
        _.omit(columnItem, ['Id']),
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
   * Deletes the column from the columns list. Deletes the column using
   * `deleteItemFromList` from the data adapter. If the column is deleted
   * successfully, it will dispatch the `COLUMN_DELETED` action to the reducer.
   */
  const onDeleteColumn = async () => {
    const isDeleted = await context.props.dataAdapter.portalDataService.deleteItemFromList(
      'PROJECT_COLUMNS',
      context.state.columnForm.column.id
    )
    if (isDeleted) {
      context.dispatch(
        COLUMN_DELETED({
          columnId: context.state.columnForm.column.id
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

  /**
   * Set column message for a specific column for a specific duration (default 5 seconds)
   *
   * @param key Key of the column to set the message for
   * @param message Message to set
   * @param durationSeconds Duration in seconds to show the message
   */
  const setColumnMessage = (key: string, message: string, durationSeconds = 5) => {
    setColumnMessages((prev) => {
      const newMessages = new Map(prev)
      newMessages.set(key, message)
      return newMessages
    })
    setTimeout(() => {
      setColumnMessages((prev) => {
        const newMessages = new Map(prev)
        newMessages.delete(key)
        return newMessages
      })
    }, durationSeconds * 1000)
  }

  /**
   * Finds a matching search property for the column internal name. If a search property
   * is found in `context.state.managedProperties` and the column field name is empty,
   * it will set the column field name to the search property.
   *
   * A message wil shown under the field name input if a search property is found.
   */
  const findMatchingSearchProperty = () => {
    const internalName = (column.get('internalName') ?? '') as string
    if (internalName.length > 3) {
      const property = _.find(context.state.managedProperties, (p) => _.startsWith(p, internalName))
      if (property && stringIsNullOrEmpty(column.get('fieldName'))) {
        setColumn('fieldName', property)
        setColumnMessage(
          'fieldName',
          format(strings.SearchPropertyFoundMessage, property, internalName),
          8
        )
      }
    }
  }

  return {
    onSave,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    isEditing,
    isSaveDisabled,
    onDeleteColumn,
    findMatchingSearchProperty,
    columnMessages
  } as const
}
