import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
import { capitalize } from 'lodash'
import * as strings from 'PortfolioWebPartsStrings'
import { useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { ADD_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import styles from './ColumnFormPanel.module.scss'

export const addColumn = () => ({
  key: '',
  fieldName: '',
  name: strings.AddColumnText,
  iconName: 'CalculatorAddition',
  iconClassName: styles.addColumnIcon,
  minWidth: 175
})

const initialColumn = {
  key: null,
  fieldName: '',
  internalname: '',
  name: '',
  minWidth: 100,
  maxWidth: 150,
  data: {
    renderAs: 'text'
  }
}

/**
 * Component logic hook for ColumnFormPanel. Handles state and dispatches actions to the reducer.
 * Also provides methods for saving and deleting columns.
 */
export function useColumnFormPanel() {
  const { state, props, dispatch } = useContext(PortfolioAggregationContext)
  const [column, setColumn] = useState<IProjectContentColumn>({
    ...initialColumn,
    ...(state.editColumn || {})
  })
  const [persistRenderAs, setPersistRenderAs] = useState(false)
  useEffect(() => {
    if (state.editColumn) {
      setColumn({
        minWidth: 100,
        maxWidth: 150,
        data: {
          renderAs: state.editColumn.dataType ?? 'text'
        },
        ...state.editColumn
      })
    }
  }, [state.editColumn])

  const onSave = async () => {
    setColumn(initialColumn)
    if (state.editColumn)
      await Promise.resolve(
        props.dataAdapter
          .updateProjectContentColumn(column, persistRenderAs)
          .then(() => {
            dispatch(ADD_COLUMN({ column: { ...column, key: column.fieldName } }))
          })
          .catch((error) => (state.error = error))
      )
    else {
      const newItem: Record<string, any> = {
        GtSortOrder: column.sortOrder || 100,
        Title: column.name,
        GtInternalName: column.internalName,
        GtManagedProperty: column.fieldName,
        GtFieldDataType: capitalize(column.data?.renderAs).split('_').join(' '),
        GtDataSourceCategory: props.title,
        GtColMinWidth: column.minWidth
      }

      await Promise.resolve(
        props.dataAdapter
          .addItemToList(strings.ProjectContentColumnsListName, newItem)
          .then((result) => {
            const updateItem = {
              GtProjectContentColumnsId: result['Id']
            }

            props.dataAdapter
              .updateDataSourceItem(updateItem, state.dataSource)
              .then(() => {
                dispatch(ADD_COLUMN({ column: { ...column, key: column.fieldName } }))
              })
              .catch((error) => (state.error = error))
          })
          .catch((error) => (state.error = error))
      )
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
