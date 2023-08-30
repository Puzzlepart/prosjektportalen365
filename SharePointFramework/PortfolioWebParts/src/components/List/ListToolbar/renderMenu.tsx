import {
  Menu,
  MenuItem,
  MenuItemCheckbox,
  MenuList,
  MenuPopover,
  MenuProps,
  MenuTrigger
} from '@fluentui/react-components'
import React, { useState } from 'react'
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
 * @param closeMenu - A function that closes the menu.
 *
 * @returns The rendered `MenuItem`, `MenuItemCheckbox`, or `Menu` (if `item` has `items`).
 */
export function renderMenuItem(item: ListMenuItem, closeMenu?: () => void) {
  if (item.value) {
    return (
      <MenuItemCheckbox
        name={item.name}
        value={item.value}
        content={item.text}
        icon={createIcon(item)}
        style={createStyle(item)}
        disabled={item.disabled}
        onClick={(e) => {
          item.onClick(e)
          closeMenu && closeMenu()
        }}
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
      onClick={(e) => {
        item.onClick(e)
        closeMenu && closeMenu()
      }}
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
  const [open, setOpen] = useState(false)
  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => {
    setOpen(data.open)
  }
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger disableButtonEnhancement>
        {renderToolbarButton(
          item,
          { justifyContent: 'left' },
          { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'inherit' }
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList
          hasCheckmarks={hasCheckmarks}
          hasIcons={hasIcons}
          checkedValues={item.checkedValues}
        >
          {items.map((menuItem) => renderMenuItem(menuItem, () => setOpen(false)))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
