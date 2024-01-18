import { ProjectContentColumn, SPProjectContentColumnItem } from 'pp365-shared-library'
import { useState } from 'react'
import { usePortfolioAggregationContext } from '../context'
import { COLUMN_FORM_PANEL_ON_SAVED, DELETE_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import { useEditableColumn } from './useEditableColumn'

/**
 * Component logic hook for ColumnFormPanel. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const context = usePortfolioAggregationContext()
  const { column, setColumn, setColumnData, isEditing } = useEditableColumn()
  const [persistRenderGlobally, setPersistRenderGlobally] = useState(false)

  const onSave = async () => {
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
    try {
      if (isEditing) {
        await context.props.dataAdapter.portalDataService.updateProjectContentColumn(
          'PROJECT_CONTENT_COLUMNS',
          columnItem,
          persistRenderGlobally
        )
      } else {
        await context.props.dataAdapter.addColumnToDataSource(columnItem, context.state.currentView)
      }

      context.dispatch(
        COLUMN_FORM_PANEL_ON_SAVED({
          column: new ProjectContentColumn(columnItem),
          isNew: !isEditing
        })
      )
    } catch (error) {}
  }

  const onDeleteColumn = async () => {
    await context.props.dataAdapter.portalDataService
      .deleteProjectContentColumn('PROJECT_CONTENT_COLUMNS', context.state.columnForm.column)
      .then(() => {
        context.dispatch(DELETE_COLUMN())
      })
  }

  const onDismiss = () => {
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Save is disabled if the column name or field name is less than 2 characters.
   */
  const isSaveDisabled = column.get('fieldName').length < 2 || column.get('name').length < 2

  /**
   * Save is disabled if the column field name is Title
   */
  const isDeleteDisabled = context.state.columnForm?.column?.fieldName === 'Title'

  return {
    onSave,
    isSaveDisabled,
    onDeleteColumn,
    isDeleteDisabled,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    persistRenderGlobally,
    setPersistRenderGlobally,
    isEditing
  } as const
}
