import { ProjectColumn } from 'pp365-shared/lib/models'
import { useColumnHeaderContextMenu } from './useColumnHeaderContextMenu'

/**
 * Handles the click event for the column header.
 *
 * @param onColumnHeaderContextMenu Callback for the column header context menu
 */
export function useColumnHeaderClick(
  onColumnHeaderContextMenu: ReturnType<typeof useColumnHeaderContextMenu>
) {
  const onColumnHeaderClick = (
    ev?: React.MouseEvent<HTMLElement, MouseEvent>,
    column?: ProjectColumn
  ) => {
    onColumnHeaderContextMenu(column, ev)
  }
  return onColumnHeaderClick
}
