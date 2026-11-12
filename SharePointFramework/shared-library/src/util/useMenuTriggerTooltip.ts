import type { TooltipProps } from '@fluentui/react-components'
import { useState } from 'react'

/**
 * Visibility of the tooltip on a menu's trigger, kept hidden while the menu is open. Fluent draws
 * no tooltip beside its open menu, but a tooltip the pointer shows then still takes the first
 * Escape, and the menu stayed open (WCAG 2.1.1). The pointer shows it without moving when the
 * menu, as it is placed, passes over the button under it.
 *
 * @returns `visible` and `onVisibleChange` for the trigger's `Tooltip`
 */
export function useMenuTriggerTooltip(
  open: boolean
): Required<Pick<TooltipProps, 'visible' | 'onVisibleChange'>> {
  const [visible, setVisible] = useState(false)
  const [openBefore, setOpenBefore] = useState(open)
  // The tooltip starts hidden when the menu opens or closes. While the menu is open, Fluent reports
  // no pointer leaving the button, so a tooltip shown then would show again on closing. Set while
  // rendering, so no render with the old visibility reaches the page.
  if (open !== openBefore) {
    setOpenBefore(open)
    setVisible(false)
  }
  return {
    visible: visible && !open,
    onVisibleChange: (_, data) => setVisible(data.visible)
  }
}
