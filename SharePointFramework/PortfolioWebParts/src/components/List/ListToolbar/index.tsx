import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Toolbar,
  ToolbarButton
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { FilterPanel } from 'pp365-shared-library'
import React, { CSSProperties, FC } from 'react'
import { useListContext } from '../context'
import { IListMenuItem } from '../types'

function createStyle(item: IListMenuItem) {
  const style: CSSProperties = {}
  if (item.width) style.width = item.width
  switch (item.type) {
    case 'header':
      {
        style.fontWeight = 'bold'
      }
      break
    case 'divider':
      {
        style.borderTop = '1px solid #eaeaea'
        style.height = '1px'
        style.minHeight = '1px'
      }
      break
  }
  return style
}

export const ListToolbar: FC = () => {
  const context = useListContext()
  return (
    <div>
      <Toolbar aria-label='Default'>
        {context.props.menuItems.map((item, index) => {
          const Icon = item.icon
          return item.items ? (
            <Menu>
              <MenuTrigger>
                <ToolbarButton
                  icon={<Icon />}
                  title={item.text}
                  style={createStyle(item)}
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {item.text}
                </ToolbarButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {item.items.map((menuItem, idx) => {
                    let MenuItemIcon = () => null
                    if (menuItem.icon) MenuItemIcon = menuItem.icon as any
                    return (
                      <MenuItem
                        key={idx}
                        content={menuItem.text}
                        icon={<MenuItemIcon />}
                        style={createStyle(menuItem)}
                        disabled={menuItem.disabled}
                        onClick={menuItem.onClick}
                      />
                    )
                  })}
                </MenuList>
              </MenuPopover>
            </Menu>
          ) : (
            <ToolbarButton
              key={index}
              icon={<Icon />}
              title={item.text}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.text}
            </ToolbarButton>
          )
        })}
      </Toolbar>
      <FilterPanel
        {...context.props.filterPanelProps}
        headerText={strings.FiltersString}
        isLightDismiss={true}
      />
    </div>
  )
}
