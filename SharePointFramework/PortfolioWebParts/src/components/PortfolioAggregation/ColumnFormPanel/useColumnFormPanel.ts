import {
  ProjectContentColumn,
  SPDataSourceItem,
  SPProjectContentColumnItem
} from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { ADD_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'

const initialColumn = new Map<string, any>([
  ['name', ''],
  ['internalName', ''],
  ['fieldName', ''],
  ['sortOrder', 100],
  ['minWidth', 100],
  ['maxWidth', 150],
  [
    'data',
    {
      renderAs: 'text'
    }
  ]
])

/**
 * Component logic hook for ColumnFormPanel. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const context = useContext(PortfolioAggregationContext)
  const [column, $setColumn] = useState<ProjectContentColumn['$map']>(initialColumn)
  const [persistRenderAs, setPersistRenderAs] = useState(false)
  const isEditing = !!context.state.columnForm.column

  useEffect(() => {
    if (isEditing) {
      $setColumn(context.state.columnForm.column.$map)
    } else {
      $setColumn(initialColumn)
    }
  }, [context.state.columnForm])

  const onSave = async () => {
    if (isEditing) {
      await Promise.resolve(
        context.props.dataAdapter
          .updateProjectContentColumn(
            {
              id: context.state.columnForm.column.id,
              minWidth: column.get('minWidth'),
              maxWidth: column.get('maxWidth'),
              renderAs: column.get('data').renderAs
            },
            persistRenderAs
          )
          .then(() => {
            context.dispatch(
              ADD_COLUMN({
                column: {
                  key: column.get('fieldName'),
                  fieldName: column.get('fieldName'),
                  name: column.get('name'),
                  minWidth: column.get('minWidth')
                }
              })
            )
          })
      )
    } else {
      const colummData = column.get('data') ?? {}
      const properties: SPProjectContentColumnItem = {
        GtSortOrder: column.get('sortOrder'),
        Title: column.get('name'),
        GtInternalName: column.get('internalName'),
        GtManagedProperty: column.get('fieldName'),
        GtFieldDataType: colummData.renderAs ?? 'Text',
        GtDataSourceCategory: context.props.title,
        GtColMinWidth: column.get('minWidth')
      }

      await Promise.resolve(
        context.props.dataAdapter.portalDataService
          .addItemToList('PROJECT_CONTENT_COLUMNS', properties)
          .then((result) => {
            const updateItem: SPDataSourceItem = {
              GtProjectContentColumnsId: result['Id']
            }
            context.props.dataAdapter
              .updateDataSourceItem(updateItem, context.state.dataSource)
              .then(() => {
                context.dispatch(
                  ADD_COLUMN({
                    column: {
                      key: column.get('fieldName'),
                      fieldName: column.get('fieldName'),
                      name: column.get('name'),
                      minWidth: column.get('minWidth')
                    }
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
