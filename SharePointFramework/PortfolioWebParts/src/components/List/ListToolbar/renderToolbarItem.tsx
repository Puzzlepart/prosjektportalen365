import { ListMenuItem } from './types'
import { renderMenu } from './renderMenu'
import { renderToolbarButton } from './renderToolbarButton'

/**
 * Renders a toolbar item.
 *
 * @param item - The item to render.
 *
 * @returns The rendered toolbar item.
 */
export function renderToolbarItem(item: ListMenuItem) {
  if (item.items) {
    return renderMenu(item)
  }
  return renderToolbarButton(item)
}
