import { MenuProps, useId } from '@fluentui/react-components'
import { useContext, useEffect, useState } from 'react'
import { FooterContext } from '../context'

/**
 * Logic of the useful links menu: it loads the links the first time it opens, and moves the
 * focus to the first of them once they are there. The menu opens on a spinner, with nothing in
 * it to take the focus, so the focus stayed on the button, outside the menu: the arrow keys did
 * not reach the links, and Escape left the menu open (WCAG 2.1.1).
 */
export function usePromotedLinks() {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-promoted-links')
  const popoverId = useId('promoted-links')
  const [open, setOpen] = useState(false)
  const isLoaded = context.areLinksLoaded && !context.isLinksLoading

  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => {
    setOpen(data.open)
    if (data.open) context.loadLinks()
  }

  useEffect(() => {
    if (!open || !isLoaded) return
    const popover = document.getElementById(popoverId)
    if (!popover || popover.contains(document.activeElement)) return
    popover.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open, isLoaded])

  return { context, fluentProviderId, popoverId, open, onOpenChange, isLoaded } as const
}
