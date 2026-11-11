import { MenuProps } from '@fluentui/react-components'
import { useMenuTriggerTooltip } from 'pp365-shared-library'
import { useState } from 'react'

/**
 * The quick launch menu's open state, and the tooltip on its button, hidden while the menu is open,
 * where it took the first Escape and left the menu open (`useMenuTriggerTooltip`).
 */
export function useProjectMenu() {
  const [open, setOpen] = useState(false)
  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => setOpen(data.open)
  const tooltip = useMenuTriggerTooltip(open)
  return { open, onOpenChange, tooltip } as const
}
