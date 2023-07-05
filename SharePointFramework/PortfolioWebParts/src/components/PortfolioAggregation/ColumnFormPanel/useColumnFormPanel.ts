import _ from 'lodash'
import {
  ProjectContentColumn,
  SPDataSourceItem,
  SPProjectContentColumnItem
} from 'pp365-shared-library'
import { useContext, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { ADD_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import { useEditableColumn } from './useEditableColumn'

/**
 * Component logic hook for ColumnFormPanel. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const context = useContext(PortfolioAggregationContext)
  const { column, setColumn, setColumnData, isEditing } = useEditableColumn()
  const [persistRenderAs, setPersistRenderAs] = useState(false)

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
          .updateProjectContentColumn(columnItem, persistRenderAs)
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
              .updateDataSourceItem(updateItem, context.state.dataSource)
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

  const onDismiss = () => {
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  return {
    onSave,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    persistRenderAs,
    setPersistRenderAs,
    isEditing
  } as const
}
