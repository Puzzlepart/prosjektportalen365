import { ToolbarButton } from '@fluentui/react-components'
import React, { CSSProperties } from 'react'
import { createStyle } from './createStyle'
import { createIcon } from './createIcon'
import { ListMenuItem } from './types'

export function useToolbarButtonRender() {
  /**
   * Renders a toolbar button based on the provided list menu item.
   *
   * @param item The list menu item to render the toolbar button for.
   * @param buttonStyle The style to apply to the toolbar button.
   * @param labelStyle The style to apply to the toolbar button label.
   *
   * @returns The rendered toolbar button component.
   */
  function renderToolbarButton(
    item: ListMenuItem,
    buttonStyle: CSSProperties = {
      fontWeight: 'var(--fontWeightRegular)'
    },
    labelStyle: CSSProperties = {}
  ) {
    return (
      <div hidden={item.hidden}>
        <ToolbarButton
          icon={createIcon(item)}
          title={item.description ?? item.text}
          aria-label={item.text ? undefined : item.description}
          style={createStyle(item, buttonStyle)}
          onClick={item.onClick}
          disabled={item.disabled}
        >
          {item.text && <span style={labelStyle}>{item.text}</span>}
        </ToolbarButton>
      </div>
    )
  }

  return { renderToolbarButton }
}
