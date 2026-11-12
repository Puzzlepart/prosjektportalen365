import { MenuProps, useId } from '@fluentui/react-components'
import { useMenuTriggerTooltip } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { FooterContext } from '../context'

/**
 * Lazily loads useful links and manages menu focus and the trigger tooltip.
 */
export function usePromotedLinks() {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-promoted-links')
  const popoverId = useId('promoted-links')
  const [open, setOpen] = useState(false)
  const isLoaded = context.areLinksLoaded && !context.isLinksLoading
  const tooltip = useMenuTriggerTooltip(open)

  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => {
    setOpen(data.open)
    if (data.open) context.loadLinks()
  }

  useEffect(() => {
    // The loading spinner cannot receive focus; move into the menu once its links arrive.
    if (!open || !isLoaded) return
    const popover = document.getElementById(popoverId)
    if (!popover || popover.contains(document.activeElement)) return
    popover.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open, isLoaded])

  return { context, fluentProviderId, popoverId, open, onOpenChange, isLoaded, tooltip } as const
}
