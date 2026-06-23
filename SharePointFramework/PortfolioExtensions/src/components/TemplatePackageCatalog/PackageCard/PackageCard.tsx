import {
  Avatar,
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  mergeClasses,
  Text,
  Tooltip
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { ICatalogPackage } from 'models'
import { PackageCompatibilityTag, PackageStatusTag, PackageUpdateTag } from './PackageBadges'
import { usePackageCard } from './usePackageCard'
import styles from './PackageCard.module.scss'

export interface IPackageCardProps {
  package: ICatalogPackage
}

/**
 * Stable DOM id for a package card. Lets the detail pane return keyboard focus
 * to the originating card when it closes (see PackageDetails).
 */
export const packageCardId = (packageId: string): string =>
  `pp-pkg-card-${packageId.replace(/[^a-zA-Z0-9_-]/g, '-')}`

export const PackageCard: FC<IPackageCardProps> = ({ package: pkg }) => {
  const { isSelected, showImage, meta, select, onCardKeyDown, onImageError } = usePackageCard(pkg)

  return (
    <Card
      id={packageCardId(pkg.id)}
      className={mergeClasses(styles.card, isSelected && styles.selected)}
      role='listitem'
      aria-selected={isSelected}
      tabIndex={0}
      floatingAction={<PackageStatusTag packageId={pkg.id} />}
      onClick={select}
      onKeyDown={onCardKeyDown}
    >
      <CardPreview className={styles.preview}>
        {showImage ? (
          <img className={styles.previewImage} src={pkg.thumbnail} alt='' onError={onImageError} />
        ) : (
          // Same fallback look as ProjectCard (ProjectLogo): a colorful square
          // avatar with the template's initials when no image is available.
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
        <Text size={200} className={styles.description}>
          {pkg.description}
        </Text>
      )}
      <Caption1 className={styles.footer}>{meta}</Caption1>
    </Card>
  )
}
