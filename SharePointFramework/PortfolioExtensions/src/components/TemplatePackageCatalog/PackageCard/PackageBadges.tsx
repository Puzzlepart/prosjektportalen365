import { makeStyles, mergeClasses, Tag, tokens, Tooltip } from '@fluentui/react-components'
import { ArrowSync16Regular, CheckmarkCircle16Regular, Cloud16Regular } from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { PpPkgType } from 'models'
import { useCatalogContext } from '../context'

const useStyles = makeStyles({
  updateTag: {
    backgroundColor: tokens.colorStatusWarningBackground2,
    borderTopColor: tokens.colorStatusWarningBorder1,
    borderRightColor: tokens.colorStatusWarningBorder1,
    borderBottomColor: tokens.colorStatusWarningBorder1,
    borderLeftColor: tokens.colorStatusWarningBorder1
  }
})

/**
 * Brand tag indicating install status: `Importert` (installed locally) or
 * `Sentral` (added from the cloud). Rendered top-right of the card image and
 * in the details title row.
 */
export const PackageStatusTag: FC<{ packageId: string }> = ({ packageId }) => {
  const { crossRefFor } = useCatalogContext()
  const ref = crossRefFor(packageId)
  if (!ref) return null
  if (ref.packageType === PpPkgType.Sentral) {
    return (
      <Tooltip content={strings.CatalogBadgeCentralTooltip} relationship='description'>
        <Tag appearance='brand' size='small' media={<Cloud16Regular />}>
          {strings.CatalogBadgeCentral}
        </Tag>
      </Tooltip>
    )
  }
  if (ref.packageType === PpPkgType.Importert) {
    return (
      <Tooltip content={strings.CatalogBadgeImportedTooltip} relationship='description'>
        <Tag appearance='brand' size='small' media={<CheckmarkCircle16Regular />}>
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
        className={mergeClasses(styles.updateTag)}
        media={<ArrowSync16Regular />}
      >
        {strings.CatalogStatusUpdate}
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
