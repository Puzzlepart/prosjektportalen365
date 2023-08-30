import { ToolbarButton } from '@fluentui/react-components'
import React, { CSSProperties } from 'react'
import { createStyle } from './createStyle'
import { createIcon } from './createIcon'
import { ListMenuItem } from './types'

/**
 * Renders a toolbar button based on the provided list menu item.
 *
 * @param item The list menu item to render the toolbar button for.
 * @param buttonStyle The style to apply to the toolbar button.
 * @param labelStyle The style to apply to the toolbar button label.
 *
 * @returns The rendered toolbar button component.
 */
export function renderToolbarButton(
  item: ListMenuItem,
  buttonStyle: CSSProperties = {},
  labelStyle: CSSProperties = {}
) {
  return (
    <ToolbarButton
      icon={createIcon(item)}
      title={item.text}
      style={createStyle(item, buttonStyle)}
      onClick={item.onClick}
      disabled={item.disabled}
    >
      <span style={labelStyle}>{item.text}</span>
    </ToolbarButton>
  )
}
