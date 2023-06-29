import _ from 'lodash'
import { IFilterItemProps } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { SHOW_HIDE_COLUMNS, TOGGLE_SHOW_HIDE_COLUMN_PANEL } from '../reducer'
import { arrayMove } from 'pp365-shared-library/lib/helpers/arrayMove'
import { OnDragEndResponder } from 'react-beautiful-dnd'

export function useEditViewColumnsPanel() {
  const { state, props, dispatch } = useContext(PortfolioAggregationContext)
  const [isChanged, setIsChanged] = useState(false)
  const initialSelection = state.columns.map((column) => ({
    id: column['id'],
    name: column.name,
    value: column.fieldName,
    selected: _.some(state.fltColumns, (c) => c.fieldName === column.fieldName)
  }))
  const [selectedColumns, setSelectedColumns] = useState<IFilterItemProps[]>(initialSelection)

  useEffect(() => {
    setSelectedColumns(initialSelection)
  }, [state.columns])

  /**
   * On save event handler.
   */
  const onSave = async () => {
    const columns = selectedColumns.filter((c) => c.selected)

    const updateItems = {
      GtProjectContentColumnsId: columns.map((c) => c['id'])
    }

    await Promise.resolve(
      props.dataAdapter
        .updateDataSourceItem(updateItems, state.dataSource, true)
        .then(() => {
          dispatch(SHOW_HIDE_COLUMNS({ columns: selectedColumns }))
        })
        .catch((error) => (state.error = error))
    )
  }

  /**
   * On dismiss event handler.
   */
  const onDismiss = () => {
    dispatch(TOGGLE_SHOW_HIDE_COLUMN_PANEL({ isOpen: false }))
  }

  /**
   * On change event handler.
   * 
   * @param col Column item
   * @param checked Checked state
   */
  const onChange = (col: IFilterItemProps, checked: boolean) => {
    const items = selectedColumns.map((i) => {
      if (i.value === col.value) {
        return { ...i, selected: checked }
      }
      return i
    })
    setSelectedColumns(items)
    setIsChanged(true)
  }

  /**
   * On drag end event handler.
   * 
   * @param result Drag and drop result
   */
  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) {
      return
    }
    const _selectedColumns = arrayMove(selectedColumns, result.source.index, result.destination.index)
    setSelectedColumns(_selectedColumns)
    setIsChanged(true)
  }

  return {
    state,
    onDismiss,
    onDragEnd,
    selectedColumns,
    onChange,
    onSave,
    isChanged,
    dispatch
  } as const
}
