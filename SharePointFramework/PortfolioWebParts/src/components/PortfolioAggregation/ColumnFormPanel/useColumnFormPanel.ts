import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
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

export function useColumnFormPanel() {
  const { state, props, dispatch } = useContext(PortfolioAggregationContext)
  const [column, setColumn] = useState<IProjectContentColumn>({
    ...initialColumn,
    ...(state.editColumn || {})
  })

  useEffect(() => {
    if (state.editColumn) {
      setColumn({
        minWidth: 100,
        maxWidth: 150,
        data: {
          renderAs: 'text'
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
          .updateProjectContentColumn(column)
          .then(() => {
            dispatch(ADD_COLUMN({ column: { ...column, key: column.fieldName } }))
          })
          .catch((error) => (state.error = error))
      )
    else {
      const renderAs =
        column.data?.renderAs.charAt(0).toUpperCase() + column.data?.renderAs.slice(1)

      const newItem = {
        GtSortOrder: column.sortOrder || 100,
        Title: column.name,
        GtInternalName: column.internalName,
        GtManagedProperty: column.fieldName,
        GtFieldDataType: renderAs,
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

  return { state, props, dispatch, onSave, onDismiss, column, setColumn } as const
}