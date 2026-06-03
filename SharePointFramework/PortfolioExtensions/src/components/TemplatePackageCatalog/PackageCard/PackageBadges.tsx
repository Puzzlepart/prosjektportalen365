import { Badge } from '@fluentui/react-components'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { PackageBadge } from 'models'
import { useCatalogContext } from '../context'

/**
 * Renders the status badge (Importert / Sentral / Oppdatering tilgjengelig)
 * for a package, derived from the Maloppsett cross-reference. Reused by both
 * the card and the details panel.
 */
export const PackageBadges: FC<{ packageId: string }> = ({ packageId }) => {
  const { crossRefFor } = useCatalogContext()
  const ref = crossRefFor(packageId)
  if (!ref) return null
  switch (ref.badge) {
    case PackageBadge.Installed:
      return (
        <Badge appearance="tint" color="informative">
          {strings.CatalogBadgeImported}
        </Badge>
      )
    case PackageBadge.Central:
      return (
        <Badge appearance="tint" color="brand">
          {strings.CatalogBadgeCentral}
        </Badge>
      )
    case PackageBadge.UpdateAvailable:
      return (
        <Badge appearance="tint" color="warning">
          {strings.CatalogBadgeUpdate}
        </Badge>
      )
    default:
      return null
  }
}
