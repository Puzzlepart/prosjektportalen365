import { ContextualMenuItemType, IContextualMenuItem } from '@fluentui/react'
import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemCheckbox,
  MenuItemProps,
  MenuPopover,
  MenuTrigger
} from '@fluentui/react-components'
import { FluentIconName, getFluentIcon } from 'pp365-shared-library/lib/icons'
import React from 'react'

/**
 * Renders a single menu item for the column context menu.
 *
 * @param item The menu item to render.
 *
 * @returns The JSX element representing the menu item.
 */
export function renderMenuItem(item: IContextualMenuItem) {
  switch (item.itemType) {
    case ContextualMenuItemType.Divider:
      return <MenuDivider />
    default: {
      const baseProps: MenuItemProps = {
        title: item.title,
        disabled: item.disabled,
        onClick: item.onClick
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
        return (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <MenuItem {...baseProps}>{item.text}</MenuItem>
            </MenuTrigger>
            <MenuPopover>
              {item.subMenuProps?.items.map((item) => renderMenuItem(item))}
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
