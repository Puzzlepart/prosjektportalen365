import { format } from '@fluentui/react/lib/Utilities'
import {
  makeStyles,
  mergeClasses,
  Tag,
  tagClassNames,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowSync16Regular,
  Box16Regular,
  CheckmarkCircle16Regular,
  Cloud16Regular,
  LocalLanguage16Regular,
  MountainTrail20Regular,
  ShieldKeyhole16Regular,
  Warning16Regular
} from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ICatalogPackage, PpPkgType } from 'models'
import { useCatalogContext } from '../context'
import { languageLabel } from '../language'

const useStyles = makeStyles({
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
  },
  // Requirement tags render flat — no border, no shadow (quiet meta under the
  // category tags). Transparent border (not none) keeps the Tag's sizing
  // identical to its default.
  requirementTag: {
    boxShadow: 'none',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    // The media (icon) slot hugs the tag's left edge by default; nudge it in
    // so the inset matches the text inset of the (icon-less) category tags.
    [`& .${tagClassNames.media}`]: {
      paddingLeft: tokens.spacingHorizontalXS
    }
  },
  // Prosjektportalen brand (logo red #bc3e42), light-tint tag from the brand scale
  // used by prosjektportalen-web.
  ppTag: {
    backgroundColor: '#fbe5e7',
    color: '#8b1a1f'
  },
  // Bestillingsportalen brand (purple #764ba2), from the brand scale used by
  // bestillingsportalen-web.
  bestillingTag: {
    backgroundColor: '#ebe7f7',
    color: '#533672'
  },
  // Microsoft Entra brand (teal-cyan, ~#00A2AD — close to the Entra ID logo).
  entraTag: {
    backgroundColor: '#e2f4f6',
    color: '#075e66'
  },
  // Language/availability tag — neutral, to sit alongside the colored dependency
  // tags without competing with them.
  languageTag: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2
  },
  requirements: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    // Same inter-tag gap as the category TagGroup above (medium → 8px).
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXS
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
 * Debug/QA marker for packages the catalog feed marks `hidden` — these only
 * appear at all when hidden packages are surfaced via `?showHidden=true` /
 * the `PP_SHOW_HIDDEN` session flag (see `services/featureFlags.ts`), so this
 * tag is what tells a staged package apart from a released one.
 */
export const PackageHiddenTag: FC<{ package: ICatalogPackage }> = ({ package: pkg }) => {
  const styles = useStyles()
  if (!pkg.hidden) return null
  return (
    <Tooltip content={strings.CatalogBadgeHiddenTooltip} relationship='description'>
      <Tag
        appearance='filled'
        size='small'
        className={mergeClasses(styles.badge, styles.updateTag)}
        media={<Warning16Regular />}
      >
        {strings.CatalogBadgeHidden}
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
 * Brand-colored dependency/compatibility tags for a package: the targeted
 * Prosjektportalen version (logo red), and whether it needs Bestillingsportalen
 * (purple) or Microsoft Entra resources (teal) for full use. The PP-version tag
 * is informational and hidden when the package is incompatible — the red
 * {@link PackageCompatibilityTag} covers that case to avoid showing the version
 * twice.
 */
export const PackageRequirementTags: FC<{ package: ICatalogPackage }> = ({ package: pkg }) => {
  const styles = useStyles()
  const { isSupported } = useCatalogContext()
  const tags: React.ReactNode[] = []

  if (pkg.minPPVersion && isSupported(pkg)) {
    tags.push(
      <Tooltip
        key='pp'
        content={format(strings.CatalogRequiresPPTooltip, pkg.minPPVersion)}
        relationship='description'
      >
        <Tag
          appearance='filled'
          size='small'
          className={mergeClasses(styles.requirementTag, styles.ppTag)}
          media={<Box16Regular />}
        >
          {format(strings.CatalogRequiresPP, pkg.minPPVersion)}
        </Tag>
      </Tooltip>
    )
  }
  if (pkg.requiresBestillingsportalen) {
    tags.push(
      <Tooltip
        key='bestilling'
        content={strings.CatalogRequiresBestillingsportalenTooltip}
        relationship='description'
      >
        <Tag
          appearance='filled'
          size='small'
          className={mergeClasses(styles.requirementTag, styles.bestillingTag)}
          media={<MountainTrail20Regular />}
        >
          {strings.CatalogRequiresBestillingsportalen}
        </Tag>
      </Tooltip>
    )
  }
  if (pkg.requiresEntra) {
    tags.push(
      <Tooltip key='entra' content={strings.CatalogRequiresEntraTooltip} relationship='description'>
        <Tag
          appearance='filled'
          size='small'
          className={mergeClasses(styles.requirementTag, styles.entraTag)}
          media={<ShieldKeyhole16Regular />}
        >
          {strings.CatalogRequiresEntra}
        </Tag>
      </Tooltip>
    )
  }
  if ((pkg.languages?.length ?? 0) > 0) {
    tags.push(
      <Tooltip key='lang' content={strings.CatalogLanguagesTooltip} relationship='description'>
        <Tag
          appearance='filled'
          size='small'
          className={mergeClasses(styles.requirementTag, styles.languageTag)}
          media={<LocalLanguage16Regular />}
        >
          {pkg.languages.map(languageLabel).join(', ')}
        </Tag>
      </Tooltip>
    )
  }

  if (tags.length === 0) return null
  return <div className={styles.requirements}>{tags}</div>
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
