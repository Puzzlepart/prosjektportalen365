import { useEffect, useState } from 'react'

/**
 * Carousel + lightbox state for {@link PackageScreenshots}: the current index,
 * lightbox open state, per-image load-error tracking, and the navigation
 * helpers. Resets when the screenshot set changes.
 */
export function usePackageScreenshots(screenshots?: string[]) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [errored, setErrored] = useState<Record<number, boolean>>({})

  const count = screenshots?.length ?? 0

  // Reset to the first image (and clear errors) when the package changes.
  useEffect(() => {
    setIndex(0)
    setErrored({})
    setLightboxOpen(false)
  }, [screenshots])

  const safeIndex = Math.min(index, Math.max(count - 1, 0))
  const go = (delta: number) => setIndex((current) => (current + delta + count) % count)

  return {
    count,
    safeIndex,
    lightboxOpen,
    isErrored: (i: number): boolean => !!errored[i],
    go,
    goTo: (i: number) => setIndex(i),
    markErrored: (i: number) => setErrored((current) => ({ ...current, [i]: true })),
    openLightbox: () => setLightboxOpen(true),
    setLightboxOpen
  }
}
