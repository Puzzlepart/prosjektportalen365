import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { SPProjectColumnItem, format } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
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
  const telemetry = useTelemetry()

  /**
   * Tells the user that the list refused a save or a delete, and counts the refusal for usage
   * statistics, once, by the error's code.
   *
   * @param error What the list answered, or the error made for a delete it refused
   */
  const onSaveFailed = (error: Error) => {
    telemetry.trackError(error)
    setSaveError(error)
  }

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
   * Save column fields, adding new columns to the current view and reporting write failures.
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
    // A column without a minimum width of its own shows the model's 100: sent back untouched, it
    // stored 100 where the list had none. A width the user did not change is not sent.
    const isMinWidthUnchanged =
      isEditing && column.get('minWidth') === context.state.columnForm.column.minWidth
    const isMaxWidthUnchanged =
      isEditing && column.get('maxWidth') === context.state.columnForm.column.maxWidth
    try {
      if (isEditing) {
        await context.props.dataAdapter.portalDataService.updateItemInList(
          'PROJECT_COLUMNS',
          context.state.columnForm.column.id,
          _.omit(columnItem, [
            'Id',
            'GtInternalName',
            'GtManagedProperty',
            ...(isMinWidthUnchanged ? ['GtColMinWidth'] : []),
            ...(isMaxWidthUnchanged ? ['GtColMaxWidth'] : [])
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
      onSaveFailed(error)
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
      onSaveFailed(error)
      return
    }
    if (!isDeleted) {
      onSaveFailed(new Error(strings.ColumnDeleteErrorText))
      return
    }
    context.dispatch(
      COLUMN_DELETED({
        columnId: context.state.columnForm.column.id
      })
    )
  }

  /**
   * Require internal name, managed property and display name of at least two characters,
   * and prevent duplicate managed properties for new columns.
   */
  const isSaveDisabled =
    column.get('internalName').length < 2 ||
    column.get('fieldName').length < 2 ||
    column.get('name').length < 2 ||
    !!columnUsingProperty

  /**
   * Set column message for a specific column for a specific duration (default 5 seconds)
   *
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
   * Also store a temporary match message; the form does not currently render it.
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
