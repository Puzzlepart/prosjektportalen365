import {
  Avatar,
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  makeStyles,
  mergeClasses,
  Text,
  Tooltip
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { ICatalogPackage } from 'models'
import { PackageCompatibilityTag, PackageStatusTag, PackageUpdateTag } from './PackageBadges'
import { usePackageCard } from './usePackageCard'
import styles from './PackageCard.module.scss'

const useHiddenOverlayStyles = makeStyles({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    zIndex: 1,
    pointerEvents: 'none'
  }
})

export interface IPackageCardProps {
  package: ICatalogPackage
}

/**
 * Stable DOM id for a package card. Lets the detail pane return keyboard focus
 * to the originating card when it closes (see PackageDetails).
 */
export const packageCardId = (packageId: string): string =>
  `pp-pkg-card-${packageId.replace(/[^a-zA-Z0-9_-]/g, '-')}`

/**
 * A package to choose: the card is a button named by the package, the chosen one marked current
 * (WCAG 4.1.2); the list item is its cell.
 */
export const PackageCard: FC<IPackageCardProps> = ({ package: pkg }) => {
  const { isSelected, showImage, meta, select, onCardKeyDown, onImageError, descriptionId } =
    usePackageCard(pkg)
  const hiddenOverlayStyles = useHiddenOverlayStyles()

  return (
    <Card
      id={packageCardId(pkg.id)}
      className={mergeClasses(styles.card, isSelected && styles.selected)}
      role='button'
      aria-label={pkg.name}
      aria-current={isSelected || undefined}
      aria-describedby={pkg.description ? descriptionId : undefined}
      tabIndex={0}
      floatingAction={<PackageStatusTag packageId={pkg.id} />}
      onClick={select}
      onKeyDown={onCardKeyDown}
    >
      <CardPreview className={styles.preview}>
        {showImage ? (
          <img className={styles.previewImage} src={pkg.thumbnail} alt='' onError={onImageError} />
        ) : (
          <Avatar
            className={styles.previewAvatar}
            color='colorful'
            shape='square'
            name={pkg.name}
            initials={pkg.name?.slice(0, 2).toUpperCase()}
            aria-hidden
          />
        )}
      </CardPreview>
      <CardHeader
        header={
          <Tooltip content={pkg.name} relationship='label'>
            <Text weight='semibold' size={400} truncate wrap={false} block>
              {pkg.name}
            </Text>
          </Tooltip>
        }
        description={
          <div className={styles.badges}>
            <PackageUpdateTag packageId={pkg.id} />
            <PackageCompatibilityTag package={pkg} />
          </div>
        }
      />
      {pkg.description && (
        <Text id={descriptionId} size={200} className={styles.description}>
          {pkg.description}
        </Text>
      )}
      <Caption1 className={styles.footer}>{meta}</Caption1>
      {pkg.hidden && <div className={hiddenOverlayStyles.overlay} aria-hidden />}
    </Card>
  )
}
