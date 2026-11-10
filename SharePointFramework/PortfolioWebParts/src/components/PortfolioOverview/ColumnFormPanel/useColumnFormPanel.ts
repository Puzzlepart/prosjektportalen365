import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { SPProjectColumnItem, format } from 'pp365-shared-library'
import { useContext, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { COLUMN_DELETED, COLUMN_FORM_PANEL_ON_SAVED, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import { useEditableColumn } from './useEditableColumn'
import { ComboboxProps, useId } from '@fluentui/react-components'
import { visibilityOptions } from './types'
import { findColumnUsingProperty } from '../../EditViewColumnsPanel/columnIdentity'
import { savedColumn } from './savedColumn'

/**
 * Component logic hook for `ColumnFormPanel`. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving columns to the list.
 */
export function useColumnFormPanel() {
  const context = useContext(PortfolioOverviewContext)
  const { column, setColumn, setColumnData, isEditing } = useEditableColumn()
  const [columnMessages, setColumnMessages] = useState<Map<string, string>>(new Map())
  // A save or delete writes to the portal site in the hub, where SharePoint enforces the
  // permission. A user whose menu was enabled but who lacks that permission gets a rejection here,
  // and must be told rather than left looking at a panel that did nothing.
  const [saveError, setSaveError] = useState<Error>(null)

  /**
   * The column of the list that already shows the managed property given for a new column. Two
   * columns on one property were mixed up in the overview, so a new one may not take it.
   */
  const columnUsingProperty = isEditing
    ? undefined
    : findColumnUsingProperty(
        column.get('fieldName'),
        [...(context?.state.columns ?? []), ...(context?.props.configuration?.columns ?? [])],
        context?.state.deletedColumnIds
      )
  const propertyInUseMessage = columnUsingProperty
    ? format(strings.SearchPropertyInUseMessage, columnUsingProperty.name)
    : undefined

  /**
   * The values of the pages the column shows on. A column shown on none keeps `['']`.
   */
  const visibility: string[] = (column.get('data')?.visibility ?? []).filter(Boolean)

  /**
   * The names of the pages the column shows on, for the closed visibility field: a multiselect
   * combobox shows only its placeholder by itself.
   */
  const visibilityText = visibilityOptions
    .filter((option) => visibility.includes(option.value))
    .map((option) => option.text)
    .join(', ')

  /**
   * Keeps the pages chosen in the visibility field.
   */
  const onVisibilityChange: ComboboxProps['onOptionSelect'] = (_event, data) => {
    setColumnData('visibility', _.isEmpty(data.selectedOptions) ? [''] : data.selectedOptions)
  }

  /**
   * Whether the column can be grouped by. The switch keeps its choice in `isGroupable`, which save
   * reads; until then it shows what the column has.
   */
  const isGroupable = !!(column.get('isGroupable') ?? column.get('data')?.isGroupable)

  /**
   * Whether the column can be filtered on.
   */
  const isRefinable = !!column.get('isRefinable')

  /**
   * Why the column cannot be deleted, when it cannot: the title column, which the overview's
   * list depends on.
   */
  const deleteDisabledReason =
    context?.state.columnForm?.column?.fieldName === 'Title'
      ? strings.TitleColumnDeleteDisabledReason
      : undefined
  const isDeleteDisabled = !!deleteDisabledReason

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_COLUMN_FORM_PANEL` action.
   */
  const onDismiss = () => {
    setSaveError(null)
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
    if (columnUsingProperty) return
    setSaveError(null)
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
      GtIsGroupable: column.get('isGroupable'),
      GtIsRefinable: column.get('isRefinable')
    }
    if (colummData.dataTypeProperties) {
      columnItem.GtFieldDataTypeProperties = JSON.stringify(colummData.dataTypeProperties, null, 2)
    }
    // A column without a minimum width of its own shows the model's 100: sent back untouched, it
    // stored 100 where the list had none.
    const isMinWidthUnchanged =
      isEditing && column.get('minWidth') === context.state.columnForm.column.minWidth
    try {
      if (isEditing) {
        await context.props.dataAdapter.portalDataService.updateItemInList(
          'PROJECT_COLUMNS',
          context.state.columnForm.column.id,
          _.omit(columnItem, [
            'Id',
            'GtInternalName',
            'GtManagedProperty',
            ...(isMinWidthUnchanged ? ['GtColMinWidth'] : [])
          ])
        )
      } else {
        // The id comes back from the list, so the column in the state can be edited and deleted
        // without a reload.
        columnItem.Id = await context.props.dataAdapter.portalDataService.addColumnToPortfolioView(
          columnItem,
          context.state.currentView
        )
      }
    } catch (error) {
      setSaveError(error)
      return
    }
    context.dispatch(
      COLUMN_FORM_PANEL_ON_SAVED({
        column: savedColumn(columnItem, isEditing ? context.state.columnForm.column : undefined),
        isNew: !isEditing
      })
    )
  }

  /**
   * Deletes the column from the columns list. Deletes the column using
   * `deleteItemFromList` from the data adapter. If the column is deleted
   * successfully, it will dispatch the `COLUMN_DELETED` action to the reducer;
   * if the list refused, the form says so.
   */
  const onDeleteColumn = async () => {
    if (isDeleteDisabled) return
    setSaveError(null)
    let isDeleted: boolean
    try {
      isDeleted = await context.props.dataAdapter.portalDataService.deleteItemFromList(
        'PROJECT_COLUMNS',
        context.state.columnForm.column.id
      )
    } catch (error) {
      setSaveError(error)
      return
    }
    if (!isDeleted) {
      setSaveError(new Error(strings.ColumnDeleteErrorText))
      return
    }
    context.dispatch(
      COLUMN_DELETED({
        columnId: context.state.columnForm.column.id
      })
    )
  }

  /**
   * Save is disabled if the column name or field name is less than 2 characters, or if another
   * column shows the managed property already.
   */
  const isSaveDisabled =
    column.get('internalName').length < 2 ||
    column.get('fieldName').length < 2 ||
    column.get('name').length < 2 ||
    !!columnUsingProperty

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
    isDeleteDisabled,
    deleteDisabledReason,
    propertyInUseMessage,
    visibility,
    visibilityText,
    onVisibilityChange,
    isRefinable,
    isGroupable,
    onDeleteColumn,
    findMatchingSearchProperty,
    columnMessages,
    saveError,
    fluentProviderId
  } as const
}
