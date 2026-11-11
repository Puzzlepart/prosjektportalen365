import { useCallback, useEffect, useRef } from 'react'
import strings from 'ProjectWebPartsStrings'

/** The longest a smooth scroll of the status page takes; without `scrollend`, the check comes then. */
const SCROLL_SETTLE_TIMEOUT = 1_000

/** Smooth scrolls given a section before it is scrolled to at once. */
const SMOOTH_ATTEMPTS = 2

/** How far from its place, in pixels, a section may sit and still count as scrolled to. */
const ARRIVED_TOLERANCE = 1

/**
 * The nearest ancestor that scrolls the element, or `undefined` when the viewport does.
 *
 * On a SharePoint page the report scrolls in a region of its own, not the document.
 */
function scrollParent(element: Element): Element | undefined {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight)
      return node
  }
  return undefined
}

/**
 * Whether the section sits at the top of what scrolls it, clear of the pinned tabs by its
 * `scroll-margin-top`, or as close to the top as the page can scroll: the last sections cannot
 * reach it, since the page ends first.
 */
export function hasArrived(section: Element): boolean {
  const scroller = scrollParent(section)
  const scrollerTop = scroller ? scroller.getBoundingClientRect().top : 0
  const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0
  const offset = section.getBoundingClientRect().top - margin - scrollerTop
  if (Math.abs(offset) <= ARRIVED_TOLERANCE) return true
  const scrolling = scroller ?? document.scrollingElement ?? document.documentElement
  const atEnd =
    scrolling.scrollTop + scrolling.clientHeight >= scrolling.scrollHeight - ARRIVED_TOLERANCE
  return atEnd && offset > 0
}

/**
 * Returns a function that scrolls a section of the status report to the top of the page, under
 * the pinned tabs.
 *
 * A smooth scroll stops short when the page changes under it: SharePoint collapsing or expanding
 * its header on the way (CI run 37111173832), or a list in the report fitting its columns anew
 * (run 39743189195, where the page stopped at a risk list and stayed). So once the scrolling has
 * ended, or after a second in a browser without `scrollend`, the section's place is checked, and
 * it is scrolled to again when it is not there: smoothly up to `SMOOTH_ATTEMPTS` times, then at
 * once, which nothing interrupts. The section is looked up afresh for every attempt, since a
 * report that reloads meanwhile mounts it anew, and a detached element scrolls nothing. Choosing
 * another section cancels what is pending for the one before.
 */
export function useScrollToSection(): (sectionId: string | number) => void {
  const cancelPending = useRef<() => void>()
  useEffect(() => () => cancelPending.current?.(), [])
  return useCallback((sectionId: string | number) => {
    cancelPending.current?.()
    const id = `${strings.ListSectionElementIdPrefix}${sectionId}`
    const section = (): HTMLElement | null => document.getElementById(id)
    if (!section()) return
    let attempts = 0
    const attempt = (): void => {
      const element = section()
      if (!element) return
      attempts += 1
      if (attempts > SMOOTH_ATTEMPTS) {
        element.scrollIntoView({ behavior: 'auto', block: 'start' })
        return
      }
      // The section's `scroll-margin-top` keeps it clear of the pinned tabs.
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const scroller = scrollParent(element) ?? document
      const settled = new AbortController()
      const check = (): void => {
        settled.abort()
        const current = section()
        if (current && hasArrived(current)) return
        attempt()
      }
      // Only the end of the scrolling that moves the section counts: a list in the report that
      // scrolls inside itself ends its own.
      const onScrollEnd = (event: Event): void => {
        if (event.target === scroller || event.target === document) check()
      }
      const timer = window.setTimeout(check, SCROLL_SETTLE_TIMEOUT)
      settled.signal.addEventListener('abort', () => window.clearTimeout(timer))
      // The page scrolls in an element, whose `scrollend` does not bubble; capturing catches it.
      document.addEventListener('scrollend', onScrollEnd, {
        capture: true,
        signal: settled.signal
      })
      cancelPending.current = () => settled.abort()
    }
    attempt()
  }, [])
}
