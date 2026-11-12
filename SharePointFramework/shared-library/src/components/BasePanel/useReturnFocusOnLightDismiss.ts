import { useCallback, useRef } from 'react'

/** How long to keep trying, while the drawer leaves and its focus trap lets go. */
const RETURN_FOCUS_TIMEOUT = 1500

/**
 * Gives the focus back to what had it when the panel opened, once the panel is closed by a click
 * outside it (WCAG 2.4.3). Fluent's drawer gives it back on Escape and from its close button, to
 * the restore target the opener carries, but not after a click on the dimmed background: the
 * focus went to the page's start (the project cards' and the lists' project information panel).
 *
 * The opener is what has the focus as the panel opens, read as it renders open. The focus goes to
 * it once the drawer has let go of it, frame by frame for a moment, and only while it is nowhere
 * else on the page, so a user who has moved on keeps their place.
 *
 * @param open Whether the panel is open
 *
 * @returns Call with the reason the drawer closed for (`DialogOpenChangeData['type']`)
 */
export function useReturnFocusOnLightDismiss(open: boolean): (type: string) => void {
  const opener = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(open)
  if (open && !wasOpen.current && typeof document !== 'undefined') {
    opener.current = document.activeElement as HTMLElement | null
  }
  wasOpen.current = open

  return useCallback((type: string) => {
    const element = opener.current
    if (type !== 'backdropClick' || !element || element === element.ownerDocument.body) return
    const document = element.ownerDocument
    const started = Date.now()
    const attempt = () => {
      const active = document.activeElement
      if (element.isConnected && (!active || active === document.body)) element.focus()
      if (document.activeElement !== element && Date.now() - started < RETURN_FOCUS_TIMEOUT) {
        requestAnimationFrame(attempt)
      }
    }
    requestAnimationFrame(attempt)
  }, [])
}
