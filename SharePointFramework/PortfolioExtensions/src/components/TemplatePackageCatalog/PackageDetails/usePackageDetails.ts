import { useEffect, useRef, useState } from 'react'
import { useCatalogContext } from '../context'
import { packageCardId } from '../PackageCard'

/**
 * Manages detail-pane focus, image fallback, confirmation dialogs and category shortcuts.
 */
export function usePackageDetails() {
  const ctx = useCatalogContext()
  const { state, setState, selectedPackage, closeDetail, setCategories } = ctx
  const [imageError, setImageError] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  // The package's heading takes the focus, named, where the pane's frame took it with no name
  // and no outline (WCAG 2.4.3, 2.4.7).
  const titleRef = useRef<HTMLHeadingElement>(null)
  const wasDetailOpen = useRef(state.detailOpen)

  useEffect(() => {
    setImageError(false)
    setConfirmReplace(false)
    setConfirmRemove(false)
    // Only for EXPLICIT selections (a card click sets detailOpen; the initial
    // auto-selection doesn't): snap the pane (its parent is the scroll
    // container) back to the top and move focus into it. Gating on detailOpen
    // keeps focus where it is when the drawer default-selects the first
    // package on load.
    if (selectedPackage && state.detailOpen) {
      rootRef.current?.parentElement?.scrollTo({ top: 0 })
      titleRef.current?.focus({ preventScroll: true })
    }
  }, [selectedPackage?.id, state.detailOpen])

  // Back from an installation's progress, which replaced the details and took the focus.
  useEffect(() => {
    if (!state.focusDetails) return
    titleRef.current?.focus()
    setState({ focusDetails: false })
  }, [state.focusDetails])

  useEffect(() => {
    if (wasDetailOpen.current && !state.detailOpen && selectedPackage) {
      document.getElementById(packageCardId(selectedPackage.id))?.focus()
    }
    wasDetailOpen.current = state.detailOpen
  }, [state.detailOpen, selectedPackage])

  const filterByTag = (tag: string) => {
    setCategories([tag])
    closeDetail()
  }

  return {
    ...ctx,
    imageError,
    onImageError: () => setImageError(true),
    confirmReplace,
    setConfirmReplace,
    confirmRemove,
    setConfirmRemove,
    rootRef,
    titleRef,
    filterByTag
  }
}
