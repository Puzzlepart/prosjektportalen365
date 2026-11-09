import { useAnnounce } from '@fluentui/react-components'
import {
  DraggableProvidedDragHandleProps,
  OnDragEndResponder,
  OnDragStartResponder,
  OnDragUpdateResponder
} from '@hello-pangea/dnd'
import strings from 'PortfolioWebPartsStrings'
import { IEditViewColumnsPanelProps } from './types'
import { useSelectableColumns } from './useSelectableColumns'
import _ from 'lodash'
import { IListColumn, arrayMove, format } from 'pp365-shared-library'
import { isSameColumn } from './columnIdentity'

/**
 * Hook that provides functionality for editing and selecting columns in a view, including
 * drag-and-drop reordering and saving the selected columns. A move, by the buttons or by a drag,
 * is told in Norwegian as it happens (WCAG 3.1.2, 4.1.3): the drag-and-drop library's own
 * announcements are English.
 *
 * Moves and the places told are counted among the selected columns, the order the view saves:
 * the list shows the selected columns first only as it opens, and a column selected afterwards
 * keeps its place below columns that are not.
 *
 * @param props The properties for the component.
 *
 * @returns An object containing the necessary functions and state for the component.
 */
export function useEditViewColumnsPanel(props: IEditViewColumnsPanelProps) {
  const { selectableColumns, selectedColumns, selectColumn, moveColumn, moveSelectedColumn } =
    useSelectableColumns(props)
  const { announce } = useAnnounce()
  const count = selectedColumns.length

  /**
   * The place of a column among the selected columns, counted from 1, or 0 when it is not selected.
   *
   * @param column The column
   */
  const positionOf = (column: IListColumn) =>
    selectedColumns.findIndex((c) => isSameColumn(c, column)) + 1

  /**
   * The place among the selected columns that the column at `fromIndex` in the list takes when it
   * is moved to `toIndex` in the list, counted from 1.
   *
   * @param fromIndex Index of the column in the list
   * @param toIndex Index in the list it is moved to
   */
  const positionAfterMove = (fromIndex: number, toIndex: number) => {
    const column = selectableColumns[fromIndex]
    const moved: IListColumn[] = arrayMove(selectableColumns, fromIndex, toIndex)
    return moved.filter((c) => c.data.isSelected).indexOf(column) + 1
  }

  /**
   * Whether a column can move one step up (`-1`) or down (`1`) among the selected columns.
   *
   * @param column The column
   * @param step `-1` for up, `1` for down
   */
  const canMoveColumn = (column: IListColumn, step: -1 | 1) => {
    const position = positionOf(column)
    return position > 0 && position + step >= 1 && position + step <= count
  }

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
      format(
        strings.ColumnLiftedAnnouncement,
        start.draggableId,
        positionOf(selectableColumns[start.source.index])
      )
    )
  }

  /** A column moved as it is dragged: where it would land. */
  const onDragUpdate: OnDragUpdateResponder = (update, provided) => {
    if (!update.destination) return
    provided.announce(
      format(
        strings.ColumnDragPositionAnnouncement,
        positionAfterMove(update.source.index, update.destination.index),
        count
      )
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
        format(
          strings.ColumnDropCancelledAnnouncement,
          result.draggableId,
          positionOf(selectableColumns[result.source.index])
        )
      )
      return
    }
    const position = positionAfterMove(result.source.index, result.destination.index)
    moveColumn(result.source.index, result.destination.index)
    provided?.announce(format(strings.ColumnMovedAnnouncement, result.draggableId, position, count))
  }

  /**
   * Moves a selected column one step up or down among the selected columns, and tells where it
   * went.
   *
   * @param column The column to move
   * @param step `-1` to move it up, `1` to move it down
   */
  const moveColumnOneStep = (column: IListColumn, step: -1 | 1) => {
    if (!canMoveColumn(column, step)) return
    moveSelectedColumn(column, step)
    announce(
      format(strings.ColumnMovedAnnouncement, column.name, positionOf(column) + step, count),
      { polite: true }
    )
  }

  /**
   * The row's drag handle props for the mouse only. As a handle for the keyboard too, the row was
   * a button holding the checkbox and the move buttons, which a screen reader cannot reach inside
   * (axe's nested-interactive). The keyboard moves a column with the move buttons instead.
   *
   * @param dragHandleProps What the library hands the row to drag it by
   */
  const mouseDragHandleProps = (dragHandleProps: DraggableProvidedDragHandleProps | null) =>
    dragHandleProps && _.omit(dragHandleProps, 'role', 'tabIndex', 'aria-describedby')

  return {
    onDragStart,
    onDragUpdate,
    onDragEnd,
    mouseDragHandleProps,
    selectableColumns,
    onChange,
    onSave,
    moveColumn: moveColumnOneStep,
    canMoveColumn,
    selectedColumns
  }
}
