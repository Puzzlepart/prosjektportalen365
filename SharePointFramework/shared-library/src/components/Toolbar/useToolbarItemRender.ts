import { useToolbarButtonRender } from './useToolbarButtonRender'
import { ListMenuItem } from './types'
import { useToolbarMenuRender } from './useToolbarMenuRender'
import { useToolbarSearchRender } from './useToolbarSearchRender'

/**
 * Selects button, menu or search rendering for each toolbar command.
 */
export function useToolbarItemRender() {
  const { renderMenu } = useToolbarMenuRender()
  const { renderToolbarButton } = useToolbarButtonRender()
  const { renderToolbarSearch } = useToolbarSearchRender()
  /**
   * Chooses search, menu or button presentation for a command.
   */
  function renderToolbarItem(item: ListMenuItem) {
    if (item.searchBox) return renderToolbarSearch(item)
    if (item.items) return renderMenu(item)
    else return renderToolbarButton(item)
  }

  return { renderToolbarItem }
}
