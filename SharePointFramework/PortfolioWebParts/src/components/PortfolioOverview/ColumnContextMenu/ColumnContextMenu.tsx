import {
  FluentProvider,
  IdPrefixProvider,
  Menu,
  MenuList,
  MenuPopover,
  useId
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { useColumnContextMenu } from './useColumnContextMenu'
import { renderMenuItem } from '../../../components/List'
import { customLightTheme } from 'pp365-shared-library'

export const ColumnContextMenu: FC = () => {
  const fluentProviderId = useId('fp-column-context-menu')

  const { target, items, open, onOpenChange, checkedValues, onCheckedValueChange } =
    useColumnContextMenu()
  return (
    <Menu
      open={open}
      onOpenChange={onOpenChange}
      positioning={{ target }}
      onCheckedValueChange={onCheckedValueChange}
      checkedValues={checkedValues}
    >
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <MenuPopover>
            <MenuList>{items.map((item) => renderMenuItem(item, onOpenChange))}</MenuList>
          </MenuPopover>
        </FluentProvider>
      </IdPrefixProvider>
    </Menu>
  )
}
