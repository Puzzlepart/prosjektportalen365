import { format } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ProjectColumn, SPProjectColumnItem } from 'pp365-shared-library'
import { useContext, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { COLUMN_DELETED, COLUMN_FORM_PANEL_ON_SAVED, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import { useEditableColumn } from './useEditableColumn'
import { useId } from '@fluentui/react-components'

/**
 * Component logic hook for `ColumnFormPanel`. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving columns to the list.
 */
export function useColumnFormPanel() {
  const context = useContext(PortfolioOverviewContext)
  const { column, setColumn, setColumnData, isEditing } = useEditableColumn()
  const [columnMessages, setColumnMessages] = useState<Map<string, string>>(new Map())

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
   * the shared `dataAdapter`.
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
      GtColMaxWidth: column.get('maxWidth'),
      GtShowFieldFrontpage: colummData.visibility.includes('Frontpage'),
      GtShowFieldPortfolio: colummData.visibility.includes('Portfolio'),
      GtShowFieldProjectStatus: colummData.visibility.includes('ProjectStatus'),
      GtIsGroupable: column.get('isGroupable'),
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
      await context.props.dataAdapter.portalDataService.addColumnToPortfolioView(
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
   * Save is disabled if the column name or field name is less than 2 characters.
   */
  const isSaveDisabled =
    column.get('internalName').length < 2 ||
    column.get('fieldName').length < 2 ||
    column.get('name').length < 2

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

  const fluentProviderId = useId('fp-column-form-panel')

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
    columnMessages,
    fluentProviderId
  } as const
}
