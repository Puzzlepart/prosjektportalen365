import { ToolbarButton } from '@fluentui/react-components'
import React, { CSSProperties } from 'react'
import { createStyle } from './createStyle'
import { createIcon } from './createIcon'
import { ListMenuItem } from './types'

/**
 * Renders a toolbar button based on the provided list menu item.
 *
 * @param item The list menu item to render the toolbar button for.
 * @param style The style to apply to the toolbar button.
 *
 * @returns The rendered toolbar button component.
 */
export function renderToolbarButton(item: ListMenuItem, style: CSSProperties = {}) {
  return (
    <ToolbarButton
      icon={createIcon(item)}
      title={item.text}
      style={createStyle(item, style)}
      onClick={item.onClick}
      disabled={item.disabled}
    >
      <span>{item.text}</span>
    </ToolbarButton>
  )
}
