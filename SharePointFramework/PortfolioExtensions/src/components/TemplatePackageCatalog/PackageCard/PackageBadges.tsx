import { format } from '@fluentui/react/lib/Utilities'
import { makeStyles, mergeClasses, Tag, tokens, Tooltip } from '@fluentui/react-components'
import {
  ArrowSync16Regular,
  CheckmarkCircle16Regular,
  Cloud16Regular,
  Warning16Regular
} from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ICatalogPackage, PpPkgType } from 'models'
import { useCatalogContext } from '../context'

const useStyles = makeStyles({
  // Tiny drop shadow so the badges lift off the card image / surface.
  badge: {
    boxShadow: tokens.shadow2
  },
  updateTag: {
    backgroundColor: tokens.colorStatusWarningBackground2,
    borderTopColor: tokens.colorStatusWarningBorder1,
    borderRightColor: tokens.colorStatusWarningBorder1,
    borderBottomColor: tokens.colorStatusWarningBorder1,
    borderLeftColor: tokens.colorStatusWarningBorder1
  },
  incompatibleTag: {
    backgroundColor: tokens.colorStatusDangerBackground2,
    color: tokens.colorStatusDangerForeground1,
    borderTopColor: tokens.colorStatusDangerBorder1,
    borderRightColor: tokens.colorStatusDangerBorder1,
    borderBottomColor: tokens.colorStatusDangerBorder1,
    borderLeftColor: tokens.colorStatusDangerBorder1
  },
  localTag: {
    backgroundColor: tokens.colorStatusDangerBackground2,
    color: tokens.colorStatusDangerForeground1,
    borderTopColor: tokens.colorStatusDangerBorder1,
    borderRightColor: tokens.colorStatusDangerBorder1,
    borderBottomColor: tokens.colorStatusDangerBorder1,
    borderLeftColor: tokens.colorStatusDangerBorder1
  }
})

/**
 * Brand tag indicating install status: `Importert` (installed locally) or
 * `Sentral` (added from the cloud). Rendered top-right of the card image and
 * in the details title row.
 */
export const PackageStatusTag: FC<{ packageId: string }> = ({ packageId }) => {
  const styles = useStyles()
  const { crossRefFor } = useCatalogContext()
  const ref = crossRefFor(packageId)
  if (!ref) return null
  if (ref.unmanaged) {
    return (
      <Tooltip content={strings.CatalogBadgeLocalTooltip} relationship='description'>
        <Tag
          appearance='filled'
          size='small'
          className={mergeClasses(styles.badge, styles.localTag)}
          media={<Warning16Regular />}
        >
          {strings.CatalogBadgeLocal}
        </Tag>
      </Tooltip>
    )
  }
  if (ref.packageType === PpPkgType.Sentral) {
    return (
      <Tooltip content={strings.CatalogBadgeCentralTooltip} relationship='description'>
        <Tag appearance='brand' size='small' className={styles.badge} media={<Cloud16Regular />}>
          {strings.CatalogBadgeCentral}
        </Tag>
      </Tooltip>
    )
  }
  if (ref.packageType === PpPkgType.Importert) {
    return (
      <Tooltip content={strings.CatalogBadgeImportedTooltip} relationship='description'>
        <Tag
          appearance='brand'
          size='small'
          className={styles.badge}
          media={<CheckmarkCircle16Regular />}
        >
          {strings.CatalogBadgeImported}
        </Tag>
      </Tooltip>
    )
  }
  return null
}

/**
 * Orange tag indicating a newer version is available for an installed/central
 * package.
 */
export const PackageUpdateTag: FC<{ packageId: string }> = ({ packageId }) => {
  const styles = useStyles()
  const { crossRefFor } = useCatalogContext()
  const ref = crossRefFor(packageId)
  if (!ref?.updateAvailable) return null
  return (
    <Tooltip content={strings.CatalogBadgeUpdateTooltip} relationship='description'>
      <Tag
        appearance='filled'
        size='small'
        className={mergeClasses(styles.badge, styles.updateTag)}
        media={<ArrowSync16Regular />}
      >
        {strings.CatalogStatusUpdate}
      </Tag>
    </Tooltip>
  )
}

/**
 * Red tag shown when the package's `minPPVersion` is newer than the installed
 * Prosjektportalen version (the package can't be used until an upgrade).
 */
export const PackageCompatibilityTag: FC<{ package: ICatalogPackage }> = ({ package: pkg }) => {
  const styles = useStyles()
  const { isSupported } = useCatalogContext()
  if (!pkg.minPPVersion || isSupported(pkg)) return null
  return (
    <Tooltip content={strings.CatalogIncompatibleTitle} relationship='description'>
      <Tag
        appearance='filled'
        size='small'
        className={mergeClasses(styles.badge, styles.incompatibleTag)}
        media={<Warning16Regular />}
      >
        {format(strings.CatalogRequiresVersion, pkg.minPPVersion)}
      </Tag>
    </Tooltip>
  )
}

/**
 * Both status + update tags (for the details title row).
 */
export const PackageBadges: FC<{ packageId: string }> = ({ packageId }) => (
  <>
    <PackageStatusTag packageId={packageId} />
    <PackageUpdateTag packageId={packageId} />
  </>
)
