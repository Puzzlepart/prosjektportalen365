import { format } from '@fluentui/react/lib/Utilities'
import { formatDate } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { useMemo, useState } from 'react'
import { ICatalogPackage } from 'models'
import { useCatalogContext } from '../context'

/**
 * Logic for a single {@link PackageCard}: selection state, the lazy image-error
 * fallback, the formatted meta line (version • published date), and the
 * click/keyboard activation handlers. Keeps PackageCard.tsx purely
 * presentational.
 *
 * @param pkg The package the card represents
 */
export function usePackageCard(pkg: ICatalogPackage) {
  const { state, setSelected } = useCatalogContext()
  const [imageError, setImageError] = useState(false)

  const isSelected = state.selectedPackageId === pkg.id
  const showImage = Boolean(pkg.thumbnail) && !imageError

  const meta = useMemo(
    () =>
      [
        pkg.version ? `v${pkg.version}` : undefined,
        pkg.publishedDate
          ? format(strings.CatalogCardPublished, formatDate(pkg.publishedDate))
          : undefined
      ]
        .filter(Boolean)
        .join('  •  '),
    [pkg.version, pkg.publishedDate]
  )

  const select = (): void => setSelected(pkg.id)

  const onCardKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelected(pkg.id)
    }
  }

  const onImageError = (): void => setImageError(true)

  return { isSelected, showImage, meta, select, onCardKeyDown, onImageError }
}
