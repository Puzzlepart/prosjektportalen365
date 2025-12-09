import {
  FluentProvider,
  IdPrefixProvider,
  Menu,
  MenuList,
  MenuPopover,
  useId
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { customLightTheme } from 'pp365-shared-library'
import { useColumnContextMenu } from './useColumnContextMenu'
import { renderMenuItem } from './renderMenuItem'

/**
 * ColumnContextMenu component for DynamicList.
 *
 * Provides context menu for column headers with options for:
 * - Sorting ascending/descending
 * - Grouping by column
 * - Editing column settings
 *
 * @component
 */
export const ColumnContextMenu: FC = () => {
  const { target, items, open, onOpenChange } = useColumnContextMenu()
  const fluentProviderId = useId('fp-column-context-menu')

  return (
    <Menu open={open} onOpenChange={onOpenChange} positioning={{ target }}>
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
