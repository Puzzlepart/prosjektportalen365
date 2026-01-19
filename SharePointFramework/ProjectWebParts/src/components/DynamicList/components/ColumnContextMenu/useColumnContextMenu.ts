import { IContextualMenuItem } from '@fluentui/react'
import { MenuProps } from '@fluentui/react-components'
import { useContext, useEffect, useState } from 'react'
import { DynamicListContext } from '../../context'

/**
 * Hook for the column header context menu in DynamicList.
 *
 * Provides context menu functionality for column operations including:
 * - Sorting ascending/descending
 * - Grouping by column
 * - Editing view columns
 *
 * @returns Context menu configuration and handlers
 */
export function useColumnContextMenu() {
  const context = useContext(DynamicListContext)
  const [open, setOpen] = useState(false)

  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => setOpen(data.open)

  useEffect(() => {
    setOpen(!!context.state.columnContextMenu?.column)
  }, [context.state.columnContextMenu])

  const columnContextMenu = {
    open,
    setOpen,
    onOpenChange,
    target: null,
    items: []
  }

  if (!context.state.columnContextMenu) return columnContextMenu

  const { column, target } = context.state.columnContextMenu
  columnContextMenu.target = target

  const isGroupable = column.data?.isGroupable === true

  const columnName = column.renderHeaderCell ? column.renderHeaderCell() : column.columnId

  const menuItems: IContextualMenuItem[] = [
    {
      key: 'GROUP_BY',
      text: `Grupper etter ${columnName}`,
      iconProps: { iconName: 'GroupList' },
      canCheck: false,
      disabled: !isGroupable,
      onClick: () => {
        // TODO: We need to implemnent grouping functionality so this is rendered properly, similar to PortfolioAggregaton/List
        context.setState({ columnContextMenu: null })
      }
    }
  ]

  columnContextMenu.items = menuItems

  return columnContextMenu
}
