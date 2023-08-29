import _ from 'lodash'
import {
  ProjectContentColumn,
  SPDataSourceItem,
  SPProjectContentColumnItem
} from 'pp365-shared-library'
import { useState } from 'react'
import { usePortfolioAggregationContext } from '../context'
import { ADD_COLUMN, DELETE_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
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
      GtDataSourceCategory: context.props.title,
      GtColMinWidth: column.get('minWidth'),
      GtColMaxWidth: column.get('maxWidth')
    }
    if (colummData.dataTypeProperties) {
      columnItem.GtFieldDataTypeProperties = JSON.stringify(colummData.dataTypeProperties, null, 2)
    }
    if (isEditing) {
      await Promise.resolve(
        context.props.dataAdapter
          .updateProjectContentColumn(columnItem, persistRenderGlobally)
          .then(() => {
            const editedColumn = new ProjectContentColumn(columnItem)
            context.dispatch(
              ADD_COLUMN({
                column: editedColumn
              })
            )
          })
      )
    } else {
      await Promise.resolve(
        context.props.dataAdapter.portalDataService
          .addItemToList('PROJECT_CONTENT_COLUMNS', _.omit(columnItem, ['Id']))
          .then((properties) => {
            const newColumn = new ProjectContentColumn(properties)
            const updateItem: SPDataSourceItem = {
              GtProjectContentColumnsId: properties.Id
            }
            context.props.dataAdapter
              .updateDataSourceItem(updateItem, context.state.currentView?.title)
              .then(() => {
                context.dispatch(
                  ADD_COLUMN({
                    column: newColumn
                  })
                )
              })
          })
      )
    }
  }

  const onDeleteColumn = async () => {
    await context.props.dataAdapter
      .deleteProjectContentColumn(context.state.columnForm.column)
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
