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
 * - the tag-filter shortcut and the user's number-formatting locale.
 *
 * The pure, package-derived render values (badges, meta line, action labels)
 * stay in the component since they're trivial and only valid once a package is
 * selected.
 */
export function usePackageDetails() {
  const ctx = useCatalogContext()
  const { props, state, selectedPackage, closeDetail, setFilter } = ctx
  const [imageError, setImageError] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [confirmCloud, setConfirmCloud] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  // Detail-pane root, focused when a package is selected so keyboard/screen
  // reader users land in the details rather than staying on the card.
  const rootRef = useRef<HTMLDivElement>(null)
  const wasDetailOpen = useRef(state.detailOpen)

  // PackageDetails is a single reused instance, so reset per-package UI flags
  // when a different package is selected — otherwise a failed thumbnail (or an
  // open confirm dialog) would carry over to the next package. Keyed on `.id`
  // since `selectedPackage` is a fresh find() on every render. Selecting a
  // package also moves focus into the pane (a11y).
  useEffect(() => {
    setImageError(false)
    setConfirmReplace(false)
    setConfirmCloud(false)
    setConfirmRemove(false)
    if (selectedPackage) rootRef.current?.focus()
  }, [selectedPackage?.id])

  // When the detail pane closes (collapsed <720px layout), return focus to the
  // card it was opened from.
  useEffect(() => {
    if (wasDetailOpen.current && !state.detailOpen && selectedPackage) {
      document.getElementById(packageCardId(selectedPackage.id))?.focus()
    }
    wasDetailOpen.current = state.detailOpen
  }, [state.detailOpen, selectedPackage])

  // Clicking a tag filters the catalog by that category and returns to the list.
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
    filterByTag,
    // Format counts in the user's culture rather than a hardcoded locale.
    numberLocale: props.context.pageContext.cultureInfo.currentUICultureName || undefined
  }
}
