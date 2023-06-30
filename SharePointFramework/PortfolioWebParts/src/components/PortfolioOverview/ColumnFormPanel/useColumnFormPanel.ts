import { ProjectColumn, SPProjectColumnItem } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'

const initialColumn = new ProjectColumn().create(null, '', '', '', null, 100)

/**
 * Component logic hook for `ColumnFormPanel`. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const context = useContext(PortfolioOverviewContext)
  const [column, setColumn] = useState<ProjectColumn>(initialColumn.set(context.state.editColumn))
  useEffect(() => {
    if (context.state.editColumn) {
      setColumn(context.state.editColumn)
    }
  }, [context.state.editColumn])

  const onSave = async () => {
    setColumn(initialColumn)
    if (context.state.editColumn) {
      // TODO: Update existing column
    } else {
      const newColumnItem: SPProjectColumnItem = {
        GtSortOrder: column.sortOrder || 100,
        Title: column.name,
        GtInternalName: column.internalName,
        GtManagedProperty: column.fieldName,
        GtFieldDataType: _.capitalize(column.data?.renderAs).split('_').join(' '),
        GtColMinWidth: column.minWidth
      }
      await Promise.resolve(
        context.props.dataAdapter
          .addItemToList(strings.ProjectColumnsListName, newColumnItem)
          .then(() => {
            // TOD: Update item with ID
          })
      )
    }
  }

  const onDismiss = () => {
    setColumn(initialColumn)
    context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  return {
    onSave,
    onDismiss,
    column,
    setColumn
  } as const
}
