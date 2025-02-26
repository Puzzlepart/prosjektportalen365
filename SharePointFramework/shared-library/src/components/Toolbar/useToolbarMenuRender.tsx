import {
  Menu,
  MenuDivider,
  MenuGroupHeader,
  MenuItem,
  MenuItemCheckbox,
  MenuList,
  MenuPopover,
  MenuProps,
  MenuTrigger,
  ToolbarButton,
  Tooltip
} from '@fluentui/react-components'
import React, { CSSProperties, useState } from 'react'
import { createIcon } from './createIcon'
import { createStyle } from './createStyle'
import { ListMenuItem } from './types'

export function useToolbarMenuRender() {
  /**
   * Renders a toolbar button based on the provided list menu item.
   *
   * @param item The list menu item to render the toolbar button for.
   * @param buttonStyle The style to apply to the toolbar button.
   * @param labelStyle The style to apply to the toolbar button label.
   *
   * @returns The rendered toolbar button component.
   */
  function renderMenuButton(
    item: ListMenuItem,
    buttonStyle: CSSProperties = {
      fontWeight: 'var(--fontWeightRegular)'
    },
    labelStyle: CSSProperties = {}
  ) {
    return (
      <div hidden={item.hidden}>
        <Tooltip
          content={item.description}
          relationship={Boolean(item.text) ? 'description' : 'label'}
          withArrow
        >
          <ToolbarButton
            icon={createIcon(item)}
            title={item.text}
            style={createStyle(item, buttonStyle)}
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {item.text && <span style={labelStyle}>{item.text}</span>}
          </ToolbarButton>
        </Tooltip>
      </div>
    )
  }

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
  function renderMenuItem(item: ListMenuItem, closeMenu?: () => void) {
    if (item.type === 'divider') return <MenuDivider />
    if (item.type === 'header') return <MenuGroupHeader>{item.text}</MenuGroupHeader>

    if (item.value) {
      return (
        <div hidden={item.hidden}>
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
        </div>
      )
    }

    if (item.items) return renderMenu(item)

    return (
      <div hidden={item.hidden}>
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
      </div>
    )
  }

  /**
   * Renders a menu for a list item.
   *
   * @param item - The list item to render the menu for.
   *
   * @returns The rendered menu.
   */
  function renderMenu(item: ListMenuItem) {
    const hasCheckmarks = item.items.some((i) => i.value)
    const hasIcons = item.items.some((i) => i.icon)
    const [open, setOpen] = useState(false)
    const onOpenChange: MenuProps['onOpenChange'] = (_, data) => {
      setOpen(data.open)
    }

    return (
      <Menu open={open} onOpenChange={onOpenChange} closeOnScroll positioning={{ autoSize: true }}>
        <MenuTrigger disableButtonEnhancement>
          {renderMenuButton(
            item,
            {
              justifyContent: 'left',
              fontWeight: 'var(--fontWeightRegular)',
              padding: '0 6px',
              minHeight: 32
            },
            { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'inherit' }
          )}
        </MenuTrigger>
        <MenuPopover>
          <MenuList
            hasCheckmarks={hasCheckmarks}
            hasIcons={hasIcons}
            checkedValues={item.checkedValues}
          >
            {item.items.map((menuItem) => renderMenuItem(menuItem, () => setOpen(false)))}
          </MenuList>
        </MenuPopover>
      </Menu>
    )
  }

  return { renderMenuItem, renderMenu }
}
