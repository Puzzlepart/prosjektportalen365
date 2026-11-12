import strings from 'PortfolioWebPartsStrings'
import { SPProjectContentColumnItem, format } from 'pp365-shared-library'
import { useState } from 'react'
import { usePortfolioAggregationContext } from '../context'
import { COLUMN_DELETED, COLUMN_FORM_PANEL_ON_SAVED, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import { useEditableColumn } from './useEditableColumn'
import { useId } from '@fluentui/react-components'
import { findColumnUsingProperty } from '../../EditViewColumnsPanel/columnIdentity'
import { savedColumn } from './savedColumn'

/**
 * Component logic hook for ColumnFormPanel. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const context = usePortfolioAggregationContext()
  const { column, setColumn, setColumnData, isEditing } = useEditableColumn()
  const [persistRenderGlobally, setPersistRenderGlobally] = useState(false)

  /**
   * The column of the category that already shows the managed property given for a new column,
   * the locked project and title columns too, which a project-level data source leaves out of
   * its columns. Two columns on one property were mixed up in the overview, which then edited and
   * deleted the one in the other's place, so a new one may not take it.
   */
  const columnUsingProperty = isEditing
    ? undefined
    : findColumnUsingProperty(
        column.get('fieldName'),
        [
          ...(context.state.allColumnsForCategory ?? []),
          ...(context.state.columns ?? []),
          ...(context.props.configuration?.columns ?? [])
        ],
        context.state.deletedColumnIds
      )
  const propertyInUseMessage = columnUsingProperty
    ? format(strings.SearchPropertyInUseMessage, columnUsingProperty.name)
    : undefined

  /**
   * Whether the column can be grouped by. The switch keeps its choice in `isGroupable`, which save
   * reads; until then it shows what the column has.
   */
  const isGroupable = !!(column.get('isGroupable') ?? column.get('data')?.isGroupable)

  /**
   * Why the column cannot be deleted, when it cannot: the title column, and a locked column (the
   * project column among them), which the overview's lists depend on.
   */
  const deleteDisabledReason =
    context.state.columnForm?.column?.fieldName === 'Title'
      ? strings.TitleColumnDeleteDisabledReason
      : context.state.columnForm?.column?.data?.isLocked
        ? strings.LockedColumnDeleteDisabledReason
        : undefined
  const isDeleteDisabled = !!deleteDisabledReason

  // A save or delete writes to the portal site in the hub, where SharePoint enforces the
  // permission. A user whose menu was enabled but who lacks that permission gets a rejection here,
  // and must be told rather than left looking at a panel that did nothing.
  const [saveError, setSaveError] = useState<Error>(null)

  /** Save column changes, adding new columns to the data source and reporting write failures. */
  const onSave = async () => {
    if (columnUsingProperty) return
    setSaveError(null)
    const colummData = column.get('data') ?? {}
    const columnItem: SPProjectContentColumnItem = {
      Id: column.get('id'),
      GtSortOrder: column.get('sortOrder'),
      Title: column.get('name'),
      GtInternalName: column.get('internalName'),
      GtManagedProperty: column.get('fieldName'),
      GtFieldDataType: colummData.renderAs ?? 'Text',
      GtDataSourceCategory: context.props.dataSourceCategory,
      GtColMinWidth: column.get('minWidth'),
      GtColMaxWidth: column.get('maxWidth'),
      GtIsGroupable: column.get('isGroupable')
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
        await context.props.dataAdapter.portalDataService.updateProjectContentColumn(
          'PROJECT_CONTENT_COLUMNS',
          isMinWidthUnchanged ? { ...columnItem, GtColMinWidth: undefined } : columnItem,
          persistRenderGlobally
        )
      } else {
        columnItem.Id = await context.props.dataAdapter.portalDataService.addColumnToDataSource(
          columnItem,
          context.state.currentView
        )
      }

      context.dispatch(
        COLUMN_FORM_PANEL_ON_SAVED({
          column: savedColumn(columnItem, isEditing ? context.state.columnForm.column : undefined),
          isNew: !isEditing
        })
      )
    } catch (error) {
      setSaveError(error)
    }
  }

  /**
   * Deletes the column from the content columns list. Deletes the column using
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
        'PROJECT_CONTENT_COLUMNS',
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
   * Dismisses the form panel by dispatching the `TOGGLE_COLUMN_FORM_PANEL` action.
   */
  const onDismiss = () => {
    setSaveError(null)
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
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

  const fluentProviderId = useId('fp-column-form-panel')

  return {
    onSave,
    isSaveDisabled,
    propertyInUseMessage,
    isGroupable,
    onDeleteColumn,
    isDeleteDisabled,
    deleteDisabledReason,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    persistRenderGlobally,
    setPersistRenderGlobally,
    isEditing,
    saveError,
    fluentProviderId
  } as const
}
