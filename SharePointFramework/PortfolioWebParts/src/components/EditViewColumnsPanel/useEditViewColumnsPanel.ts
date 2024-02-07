import { IColumn } from '@fluentui/react'
import { OnDragEndResponder } from 'react-beautiful-dnd'
import { IEditViewColumnsPanelProps } from './types'
import { useSelectableColumns } from './useSelectableColumns'
import _ from 'lodash'
import { useId } from '@fluentui/react-components'

/**
 * Hook that provides functionality for editing and selecting columns in a view.
 *
 * @param props The properties for the component.
 *
 * @returns An object containing the necessary functions and state for the component.
 */
export function useEditViewColumnsPanel(props: IEditViewColumnsPanelProps) {
  const { selectableColumns, selectedColumns, selectColumn, moveColumn } =
    useSelectableColumns(props)

  /**
   * On save event handler.
   */
  const onSave = () => {
    props.onSave(
      selectedColumns,
      selectedColumns.map((c) => _.get(c, 'id'))
    )
  }

  /**
   * On change event handler.
   *
   * @param col Column item
   * @param isSelected Selected state
   */
  const onChange = (col: IColumn, isSelected: boolean, idx: number) => {
    selectColumn(col, isSelected, idx)
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
    moveColumn(result.source.index, result.destination.index)
  }

  const fluentProviderHeaderId = useId('fp-edit-view-columns-panel-header')
  const fluentProviderBodyId = useId('fp-edit-view-columns-panel-body')

  return {
    onDragEnd,
    selectableColumns,
    onChange,
    onSave,
    moveColumn: (column: IColumn, moveIndex: number) => {
      const columnIndex = selectedColumns.findIndex((c) => c.fieldName === column.fieldName)
      if (columnIndex > -1) {
        moveColumn(columnIndex, columnIndex + moveIndex)
      }
    },
    fluentProviderHeaderId,
    fluentProviderBodyId,
    selectedColumns
  }
}
