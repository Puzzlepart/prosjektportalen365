import strings from 'PortfolioWebPartsStrings'
import { SPProjectColumnItem } from 'pp365-shared-library'
import { useContext, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../reducer'

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

  /**
   * Dismisses the form panel and resets the column state.
   */
  const onDismiss = () => {
    $setColumn(initialColumn)
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the column to the list.
   */
  const onSave = async () => {
    if (context.state.editColumn) {
      // TODO: Update existing column
    } else {
      const colummData = column.get('data') ?? {}
      const newColumnItem: SPProjectColumnItem = {
        GtSortOrder: column.get('sortOrder'),
        Title: column.get('name'),
        GtInternalName: column.get('internalName'),
        GtManagedProperty: column.get('fieldName'),
        GtFieldDataType: colummData.renderAs,
        GtColMinWidth: column.get('minWidth'),
        GtShowFieldFrontpage: colummData.visibility.includes('Frontpage'),
        GtShowFieldPortfolio: colummData.visibility.includes('Portfolio'),
        GtShowFieldProjectStatus: colummData.visibility.includes('ProjectStatus'),
        GtIsGroupable: colummData.isGroupable,
        GtIsRefinable: column.get('isRefinable')
      }
      await context.props.dataAdapter.addItemToList(strings.ProjectColumnsListName, newColumnItem)
    }
    onDismiss()
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
      data[key] = value
      newColumn.set('data', data)
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
