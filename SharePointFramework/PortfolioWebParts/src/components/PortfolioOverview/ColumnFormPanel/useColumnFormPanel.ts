import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn, SPProjectColumnItem } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { COLUMN_FORM_PANEL_ON_SAVED, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
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

  useEffect(() => {
    if (context.state.editColumn) {
      $setColumn(context.state.editColumn)
    }
  }, [context.state.editColumn])

  /**
   * Dismisses the form panel and resets the column state.
   */
  const onDismiss = () => {
    $setColumn(initialColumn)
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
    if (context.state.editColumn) {
      const id = column.get('id')
      await context.props.dataAdapter.updateItemInList(
        strings.ProjectColumnsListName,
        id,
        _.omit(columnItem, ['GtInternalName', 'GtManagedProperty'])
      )
    } else {
      const item = await context.props.dataAdapter.addItemToList<any>(strings.ProjectColumnsListName, columnItem)
      columnItem.Id = item.Id
      const currentViewColumnIds = context.state.currentView.columns.map((c) => c.id)
      await context.props.dataAdapter.updateItemInList(
        strings.PortfolioViewsListName,
        context.state.currentView.id,
        {
          GtPortfolioColumnsId: {
            results: [...currentViewColumnIds, columnItem.Id]
          }
        }
      )
    }
    $setColumn(initialColumn)
    context.dispatch(COLUMN_FORM_PANEL_ON_SAVED({
      column: new ProjectColumn(columnItem),
      isNew: !context.state.editColumn
    }))
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
    setColumnData
  } as const
}
