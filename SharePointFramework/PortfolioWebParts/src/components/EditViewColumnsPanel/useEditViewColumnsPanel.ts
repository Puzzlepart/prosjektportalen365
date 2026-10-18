import { useAnnounce } from '@fluentui/react-components'
import { OnDragEndResponder, OnDragStartResponder, OnDragUpdateResponder } from '@hello-pangea/dnd'
import strings from 'PortfolioWebPartsStrings'
import { IEditViewColumnsPanelProps } from './types'
import { useSelectableColumns } from './useSelectableColumns'
import _ from 'lodash'
import { IListColumn, format } from 'pp365-shared-library'

/**
 * Hook that provides functionality for editing and selecting columns in a view, including
 * drag-and-drop reordering and saving the selected columns. A move, by the buttons or by a drag
 * from the keyboard, is told in Norwegian as it happens (WCAG 3.1.2, 4.1.3): the drag-and-drop
 * library's own announcements are English.
 *
 * @param props The properties for the component.
 *
 * @returns An object containing the necessary functions and state for the component.
 */
export function useEditViewColumnsPanel(props: IEditViewColumnsPanelProps) {
  const { selectableColumns, selectedColumns, selectColumn, moveColumn } =
    useSelectableColumns(props)
  const { announce } = useAnnounce()
  const count = selectedColumns.length

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
  const onChange = (col: IListColumn, isSelected: boolean) => {
    selectColumn(col, isSelected)
  }

  /** A column lifted for a drag: where it was. */
  const onDragStart: OnDragStartResponder = (start, provided) => {
    provided.announce(
      format(strings.ColumnLiftedAnnouncement, start.draggableId, start.source.index + 1)
    )
  }

  /** A column moved as it is dragged: where it would land. */
  const onDragUpdate: OnDragUpdateResponder = (update, provided) => {
    if (!update.destination) return
    provided.announce(
      format(strings.ColumnDragPositionAnnouncement, update.destination.index + 1, count)
    )
  }

  /**
   * On drag end event handler: the column moved where it was dropped, or back where it was.
   *
   * @param result Drag and drop result
   * @param provided What the library gives to announce with
   */
  const onDragEnd: OnDragEndResponder = (result, provided) => {
    if (!result.destination) {
      provided?.announce(
        format(strings.ColumnDropCancelledAnnouncement, result.draggableId, result.source.index + 1)
      )
      return
    }
    moveColumn(result.source.index, result.destination.index)
    provided?.announce(
      format(
        strings.ColumnMovedAnnouncement,
        result.draggableId,
        result.destination.index + 1,
        count
      )
    )
  }

  return {
    onDragStart,
    onDragUpdate,
    onDragEnd,
    selectableColumns,
    onChange,
    onSave,
    moveColumn: (column: IListColumn, moveIndex: number) => {
      const columnIndex = selectedColumns.findIndex((c) => c.fieldName === column.fieldName)
      if (columnIndex > -1) {
        moveColumn(columnIndex, columnIndex + moveIndex)
        announce(
          format(strings.ColumnMovedAnnouncement, column.name, columnIndex + moveIndex + 1, count),
          { polite: true }
        )
      }
    },
    selectedColumns
  }
}
