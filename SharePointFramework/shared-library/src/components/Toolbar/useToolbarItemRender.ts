import { useToolbarButtonRender } from './useToolbarButtonRender'
import { ListMenuItem } from './types'
import { useToolbarMenuRender } from './useToolbarMenuRender'

export function useToolbarItemRender() {
  const { renderMenu } = useToolbarMenuRender()
  const { renderToolbarButton } = useToolbarButtonRender()
  /**
   * Renders a toolbar item.
   *
   * @param item - The item to render.
   *
   * @returns The rendered toolbar item.
   */
  function renderToolbarItem(item: ListMenuItem) {
    if (item.items) return renderMenu(item)
    else return renderToolbarButton(item)
  }

  return { renderToolbarItem }
}
