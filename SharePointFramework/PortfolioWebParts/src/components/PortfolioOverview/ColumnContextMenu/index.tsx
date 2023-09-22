import { Menu, MenuList, MenuPopover } from '@fluentui/react-components'
import { renderMenuItem } from 'components/List/ColumnContextMenu/renderMenuItem'
import React, { FC } from 'react'
import { useColumnContextMenu } from './useColumnContextMenu'

export const ColumnContextMenu: FC = () => {
  const { target, items, open, onOpenChange, checkedValues, onCheckedValueChange } = useColumnContextMenu()
  console.log(checkedValues)
  return (
    <Menu
      open={open}
      persistOnItemClick={false}
      onOpenChange={onOpenChange}
      positioning={{ target }}
      onCheckedValueChange={onCheckedValueChange}
      checkedValues={checkedValues}
    >
      <MenuPopover>
        <MenuList>
          {
            items.map((item) => renderMenuItem(item))
          }
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
