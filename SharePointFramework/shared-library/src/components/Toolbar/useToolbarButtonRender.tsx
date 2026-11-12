import { ToolbarButton, useRestoreFocusTarget } from '@fluentui/react-components'
import React, { CSSProperties } from 'react'
import { createStyle } from './createStyle'
import { createIcon } from './createIcon'
import { ListMenuItem } from './types'

/**
 * Renders toolbar buttons with accessible names and focus restoration.
 */
export function useToolbarButtonRender() {
  // Where the focus goes back to when a panel or dialog the button opened closes: Fluent marks
  // only its own triggers so, and the filter panel, for one, opens from state (WCAG 2.4.3).
  const restoreFocusTarget = useRestoreFocusTarget()

  /**
   * Renders a command button with its configured icon, label and styles.
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
          {...restoreFocusTarget}
          icon={createIcon(item)}
          title={item.description ?? item.text}
          aria-label={item.ariaLabel ?? (item.text ? undefined : item.description)}
          style={createStyle(item, buttonStyle)}
          onClick={item.onClick}
          // Focusable while disabled: the toolbar's arrow keys reach it, and a screen reader reads
          // the description that says why it cannot be used (WCAG 2.1.1).
          disabledFocusable={item.disabled}
        >
          {item.text && <span style={labelStyle}>{item.text}</span>}
        </ToolbarButton>
      </div>
    )
  }

  return { renderToolbarButton }
}
