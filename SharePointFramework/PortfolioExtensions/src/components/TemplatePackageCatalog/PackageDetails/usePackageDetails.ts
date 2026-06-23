import { useEffect, useRef, useState } from 'react'
import { useCatalogContext } from '../context'
import { packageCardId } from '../PackageCard'

/**
 * State, refs, effects and handlers for {@link PackageDetails} — the detail
 * pane's stateful logic, kept out of the (presentational) component:
 *
 * - broken-thumbnail tracking (reset per package),
 * - the three confirm-dialog flags (reset per package),
 * - focus management: focus the pane when a package is selected, and return
 *   focus to the originating card when the pane closes (collapsed layout),
 * - the tag-filter shortcut.
 *
 * The pure, package-derived render values (badges, meta line, action labels)
 * stay in the component since they're trivial and only valid once a package is
 * selected.
 */
export function usePackageDetails() {
  const ctx = useCatalogContext()
  const { state, selectedPackage, closeDetail, setFilter } = ctx
  const [imageError, setImageError] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [confirmCloud, setConfirmCloud] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const wasDetailOpen = useRef(state.detailOpen)

  useEffect(() => {
    setImageError(false)
    setConfirmReplace(false)
    setConfirmCloud(false)
    setConfirmRemove(false)
    if (selectedPackage) rootRef.current?.focus()
  }, [selectedPackage?.id])

  useEffect(() => {
    if (wasDetailOpen.current && !state.detailOpen && selectedPackage) {
      document.getElementById(packageCardId(selectedPackage.id))?.focus()
    }
    wasDetailOpen.current = state.detailOpen
  }, [state.detailOpen, selectedPackage])

  const filterByTag = (tag: string) => {
    setFilter('category', tag)
    closeDetail()
  }

  return {
    ...ctx,
    imageError,
    onImageError: () => setImageError(true),
    confirmReplace,
    setConfirmReplace,
    confirmCloud,
    setConfirmCloud,
    confirmRemove,
    setConfirmRemove,
    rootRef,
    filterByTag
  }
}
