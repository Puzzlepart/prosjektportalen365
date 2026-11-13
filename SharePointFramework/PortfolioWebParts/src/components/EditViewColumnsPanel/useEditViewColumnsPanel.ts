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
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect, useRef, useState } from 'react'
import { isSameColumn } from './columnIdentity'

/** The attribute a move button carries its column's name in, to find it again after a move. */
export const MOVE_COLUMN_ATTRIBUTE = 'data-move-column'

/** The attribute a move button carries its step in: -1 up, 1 down. */
export const MOVE_STEP_ATTRIBUTE = 'data-move-step'

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
 * A save the view's list refuses, of the columns or of their order put back, leaves the panel
 * open with the columns as chosen and is told above them; it is counted for usage statistics,
 * once, by its error code, for the web part the panel is in.
 */
export function useEditViewColumnsPanel(props: IEditViewColumnsPanelProps) {
  const { selectableColumns, selectedColumns, selectColumn, moveColumn, moveSelectedColumn } =
    useSelectableColumns(props)
  const { announce } = useAnnounce()
  const telemetry = useTelemetry()
  const count = selectedColumns.length
  // A save writes to the views list in the hub, where SharePoint enforces the permission. A user
  // the menu let in but the list refuses must be told, not left with a panel that did nothing.
  const [saveError, setSaveError] = useState<string>()

  // The panel stays mounted while it is closed: a refusal it told of is gone whenever it closes
  // or opens again.
  useEffect(() => setSaveError(undefined), [props.open])

  /**
   * Runs a save of the view, which the panel's owner makes and closes the panel after. One that
   * is refused is told in the panel and counted here, where both overviews' saves end up.
   *
   * @param save The owner's save, with the columns it is to save
   */
  const saveView = async (save: () => void | Promise<void>) => {
    setSaveError(undefined)
    try {
      await save()
    } catch (error) {
      telemetry.trackError(error)
      setSaveError(strings.ViewSaveErrorText)
    }
  }

  /**
   * The place of a column among the selected columns, counted from 1, or 0 when it is not selected.
   */
  const positionOf = (column: IListColumn) =>
    selectedColumns.findIndex((c) => isSameColumn(c, column)) + 1

  /**
   * The place among the selected columns that the column at `fromIndex` in the list takes when it
   * is moved to `toIndex` in the list, counted from 1.
   */
  const positionAfterMove = (fromIndex: number, toIndex: number) => {
    const column = selectableColumns[fromIndex]
    const moved: IListColumn[] = arrayMove(selectableColumns, fromIndex, toIndex)
    return moved.filter((c) => c.data.isSelected).indexOf(column) + 1
  }

  /**
   * Whether a column can move one step up (`-1`) or down (`1`) among the selected columns.
   */
  const canMoveColumn = (column: IListColumn, step: -1 | 1) => {
    const position = positionOf(column)
    return position > 0 && position + step >= 1 && position + step <= count
  }

  /**
   * Save selected columns and their IDs in view order.
   */
  const onSave = () =>
    saveView(() =>
      props.onSave(
        selectedColumns,
        selectedColumns.map((c) => _.get(c, 'id'))
      )
    )

  /**
   * Put the view's columns back in the columns' own order, where the owner offers it.
   */
  const onRevertOrder = () => saveView(() => props.revertOrder?.onClick(selectableColumns))

  /**
   * Update a column's selection without changing its position.
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
   * Commit a drop or announce cancellation without moving the column.
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

  // The move button to give the focus back to once the moved row is drawn again.
  const movedFrom = useRef<{ name: string; step: -1 | 1 }>(null)

  /**
   * Moves a selected column one step up or down among the selected columns, and tells where it
   * went.
   */
  const moveColumnOneStep = (column: IListColumn, step: -1 | 1) => {
    if (!canMoveColumn(column, step)) return
    movedFrom.current = { name: column.name, step }
    moveSelectedColumn(column, step)
    announce(
      format(strings.ColumnMovedAnnouncement, column.name, positionOf(column) + step, count),
      { polite: true }
    )
  }

  // The moved row's button keeps the focus, or its other one where it can move no further (WCAG
  // 2.4.3): the row is moved in the page as it is drawn again, which took the focus from it, and
  // the focus went behind the panel, to the list's «Legg til kolonne», where the next Enter
  // opened the list's column menu.
  useEffect(() => {
    const moved = movedFrom.current
    if (!moved) return
    movedFrom.current = null
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>(`[${MOVE_COLUMN_ATTRIBUTE}]`)
    ).filter((button) => button.getAttribute(MOVE_COLUMN_ATTRIBUTE) === moved.name)
    const button = (step: number) =>
      buttons.find((candidate) => candidate.getAttribute(MOVE_STEP_ATTRIBUTE) === String(step))
    const same = button(moved.step)
    const target = same?.getAttribute('aria-disabled') === 'true' ? button(-moved.step) : same
    target?.focus()
  }, [selectableColumns])

  /**
   * The row's drag handle props for the mouse only. As a handle for the keyboard too, the row was
   * a button holding the checkbox and the move buttons, which a screen reader cannot reach inside
   * (axe's nested-interactive). The keyboard moves a column with the move buttons instead.
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
    onRevertOrder,
    saveError,
    moveColumn: moveColumnOneStep,
    canMoveColumn,
    selectedColumns
  }
}
