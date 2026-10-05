import { useCallback, useEffect, useRef } from 'react'
import strings from 'ProjectWebPartsStrings'

/** The longest a smooth scroll of the status page takes; without `scrollend`, the check comes then. */
const SCROLL_SETTLE_TIMEOUT = 1_000

/**
 * Returns a function that scrolls a section of the status report to the top of the page, under
 * the pinned tabs.
 *
 * SharePoint collapses its header when the page scrolls down past it and expands it on the way
 * up, and that change of layout stops a smooth scroll under way, leaving the page between two
 * sections. On a fast machine it comes mid-scroll (CI run 37111173832). So once the scrolling has
 * ended, the section is scrolled to once more: nothing happens when the first scroll got there,
 * and the rest of the way when it did not, the header having changed by then. Choosing another
 * section before that cancels the second scroll.
 */
export function useScrollToSection(): (sectionId: string | number) => void {
  const cancelPending = useRef<() => void>()
  useEffect(() => () => cancelPending.current?.(), [])
  return useCallback((sectionId: string | number) => {
    cancelPending.current?.()
    const section = document.getElementById(`${strings.ListSectionElementIdPrefix}${sectionId}`)
    if (!section) return
    // The section's `scroll-margin-top` keeps it clear of the pinned tabs.
    const scroll = (): void => section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const settled = new AbortController()
    const scrollOn = (): void => {
      settled.abort()
      scroll()
    }
    const timer = window.setTimeout(scrollOn, SCROLL_SETTLE_TIMEOUT)
    settled.signal.addEventListener('abort', () => window.clearTimeout(timer))
    // The page scrolls in an element, whose `scrollend` does not bubble; capturing catches it.
    document.addEventListener('scrollend', scrollOn, { capture: true, signal: settled.signal })
    cancelPending.current = () => settled.abort()
    scroll()
  }, [])
}
