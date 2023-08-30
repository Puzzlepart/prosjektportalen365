import { ToolbarButton } from '@fluentui/react-components'
import React from 'react'
import { createStyle } from './createStyle'
import { createIcon } from './createIcon'
import { ListMenuItem } from './types'

/**
 * Renders a toolbar button based on the provided list menu item.
 *
 * @param item The list menu item to render the toolbar button for.
 *
 * @returns The rendered toolbar button component.
 */
export function renderToolbarButton(item: ListMenuItem) {
  return (
    <ToolbarButton
      icon={createIcon(item)}
      title={item.text}
      style={createStyle(item)}
      onClick={item.onClick}
      disabled={item.disabled}
    >
      {item.text}
    </ToolbarButton>
  )
}
