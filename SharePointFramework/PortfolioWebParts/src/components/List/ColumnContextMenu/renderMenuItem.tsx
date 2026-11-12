import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemCheckbox,
  MenuItemProps,
  MenuPopover,
  MenuProps,
  MenuTrigger
} from '@fluentui/react-components'
import { FluentIconName, getFluentIcon } from 'pp365-shared-library/lib/icons'
import React from 'react'
import { IMenuItem } from 'pp365-shared-library'

/**
 * Render a column-menu command, checkable item, divider or nested submenu.
 */
export function renderMenuItem(item: IMenuItem, onOpenChange: MenuProps['onOpenChange']) {
  switch (item.itemType) {
    case 'divider':
      return <MenuDivider key={item.key} />
    default: {
      const baseProps: MenuItemProps = {
        title: item.title,
        disabled: item.disabled,
        // With the item's own event: «Endre kolonnebredde» hands it to Fluent's keyboard mode.
        onClick: (event) => {
          if (item.onClick) {
            item.onClick(event, item)
          }
          onOpenChange(null, { open: false } as any)
        }
      }
      if (item.iconProps?.iconName) {
        baseProps.icon = getFluentIcon(item.iconProps.iconName as FluentIconName)
      }
      if (item.canCheck) {
        return (
          <MenuItemCheckbox
            {...baseProps}
            key={item.key}
            name={item.data?.name}
            value={item.data?.value}
          >
            {item.text}
          </MenuItemCheckbox>
        )
      }
      if (item.subMenuProps?.items) {
        const { onClick: _closeMenu, ...triggerProps } = baseProps
        return (
          <Menu key={item.key}>
            <MenuTrigger disableButtonEnhancement>
              <MenuItem {...triggerProps} hasSubmenu>
                {item.text}
              </MenuItem>
            </MenuTrigger>
            <MenuPopover>
              {item.subMenuProps?.items.map((item) => renderMenuItem(item, onOpenChange))}
            </MenuPopover>
          </Menu>
        )
      }
      return (
        <MenuItem {...baseProps} key={item.key}>
          {item.text}
        </MenuItem>
      )
    }
  }
}
