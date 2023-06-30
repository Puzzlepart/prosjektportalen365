import { ProjectColumn } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import { ADD_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'

const initialColumn = new ProjectColumn().create(null, '', '', '', null, 100)

/**
 * Component logic hook for `ColumnFormPanel`. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const { state, props, dispatch } = useContext(PortfolioOverviewContext)
  const [column, setColumn] = useState<ProjectColumn>(initialColumn.set(state.editColumn))
  const [persistRenderAs, setPersistRenderAs] = useState(false)
  useEffect(() => {
    if (state.editColumn) {
      setColumn(state.editColumn)
    }
  }, [state.editColumn])

  const onSave = async () => {
    setColumn(initialColumn)
    if (state.editColumn)
      await Promise.resolve(
        props.dataAdapter
          .updateProjectContentColumn(column, persistRenderAs)
          .then(() => {
            dispatch(ADD_COLUMN({ column }))
          })
          .catch((error) => (state.error = error))
      )
    else {
      // const newItem: Record<string, any> = {
      //   GtSortOrder: column.sortOrder || 100,
      //   Title: column.name,
      //   GtInternalName: column.internalName,
      //   GtManagedProperty: column.fieldName,
      //   GtFieldDataType: capitalize(column.data?.renderAs).split('_').join(' '),
      //   GtDataSourceCategory: props.title,
      //   GtColMinWidth: column.minWidth
      // }
      // await Promise.resolve(
      //   props.dataAdapter
      //     .addItemToList(strings.ProjectContentColumnsListName, newItem)
      //     .then((result) => {
      //       const updateItem = {
      //         GtProjectContentColumnsId: result['Id']
      //       }
      //       props.dataAdapter
      //         .updateDataSourceItem(updateItem, state.dataSource)
      //         .then(() => {
      //           dispatch(ADD_COLUMN({ column: { ...column, key: column.fieldName } }))
      //         })
      //         .catch((error) => (state.error = error))
      //     })
      //     .catch((error) => (state.error = error))
      // )
    }
  }

  const onDismiss = () => {
    setColumn(initialColumn)
    dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  return {
    state,
    props,
    dispatch,
    onSave,
    onDismiss,
    column,
    setColumn,
    persistRenderAs,
    setPersistRenderAs
  } as const
}
