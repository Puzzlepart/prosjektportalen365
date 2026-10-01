import { RefObject, useEffect, useState } from 'react'

/**
 * The width of an element, kept current as it resizes. `0` until it has been measured, and always
 * `0` where there is no layout or no `ResizeObserver`, such as under jsdom.
 *
 * @param ref The element to measure
 * @param enabled Whether to measure at all; a grid that does not fit its columns has no use for
 * the width and should not re-render on every resize
 */
export function useContainerWidth(ref: RefObject<HTMLElement>, enabled = true): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof ResizeObserver === 'undefined') return undefined
    const measure = () => setWidth(element.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled])
  return width
}
