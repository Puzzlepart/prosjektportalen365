import {
  Menu,
  MenuItem,
  MenuItemCheckbox,
  MenuList,
  MenuPopover,
  MenuTrigger
} from '@fluentui/react-components'
import React from 'react'
import { createStyle } from './createStyle'
import { createIcon } from './createIcon'
import { ListMenuItem } from './types'
import { renderToolbarButton } from './renderToolbarButton'

/**
 * Renders a menu item based on the provided `IListMenuItem`.
 * If the `IListMenuItem` has a `value` property, it will render a `MenuItemCheckbox`.
 * If the `IListMenuItem` has an `items` property, it will recursively call `renderMenu`.
 * Otherwise, it will render a regular `MenuItem`.
 *
 * @param item - The `IListMenuItem` to render.
 *
 * @returns The rendered `MenuItem`, `MenuItemCheckbox`, or `Menu` (if `item` has `items`).
 */
export function renderMenuItem(item: ListMenuItem) {
  if (item.value) {
    return (
      <MenuItemCheckbox
        name={item.name}
        value={item.value}
        content={item.text}
        icon={createIcon(item)}
        style={createStyle(item)}
        disabled={item.disabled}
        onClick={item.onClick}
      />
    )
  }
  if (item.items) return renderMenu(item)
  return (
    <MenuItem
      content={item.text}
      icon={createIcon(item)}
      style={createStyle(item)}
      disabled={item.disabled}
      onClick={item.onClick}
    />
  )
}

/**
 * Renders a menu for a list item.
 *
 * @param item - The list item to render the menu for.
 *
 * @returns The rendered menu.
 */
export function renderMenu(item: ListMenuItem) {
  const { items } = item
  const hasCheckmarks = items.some((i) => i.value)
  const hasIcons = items.some((i) => i.icon)
  return (
    <Menu>
      <MenuTrigger>{renderToolbarButton(item)}</MenuTrigger>
      <MenuPopover>
        <MenuList
          hasCheckmarks={hasCheckmarks}
          hasIcons={hasIcons}
          checkedValues={item.checkedValues}
        >
          {items.map((menuItem) => renderMenuItem(menuItem))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
