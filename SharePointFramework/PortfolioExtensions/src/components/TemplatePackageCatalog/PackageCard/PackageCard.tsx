import { format } from '@fluentui/react/lib/Utilities'
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
import { formatDate } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useState } from 'react'
import { ICatalogPackage } from 'models'
import { useCatalogContext } from '../context'
import { PackageCompatibilityTag, PackageStatusTag, PackageUpdateTag } from './PackageBadges'
import styles from './PackageCard.module.scss'

export interface IPackageCardProps {
  package: ICatalogPackage
}

export const PackageCard: FC<IPackageCardProps> = ({ package: pkg }) => {
  const { state, setSelected } = useCatalogContext()
  const [imageError, setImageError] = useState(false)
  const isSelected = state.selectedPackageId === pkg.id
  const showImage = Boolean(pkg.thumbnail) && !imageError

  const meta = [
    pkg.version ? `v${pkg.version}` : undefined,
    pkg.publishedDate
      ? format(strings.CatalogCardPublished, formatDate(pkg.publishedDate))
      : undefined
  ]
    .filter(Boolean)
    .join('  •  ')

  return (
    <Card
      className={mergeClasses(styles.card, isSelected && styles.selected)}
      role='listitem'
      aria-selected={isSelected}
      tabIndex={0}
      floatingAction={<PackageStatusTag packageId={pkg.id} />}
      onClick={() => setSelected(pkg.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setSelected(pkg.id)
        }
      }}
    >
      <CardPreview className={styles.preview}>
        {showImage ? (
          <img
            className={styles.previewImage}
            src={pkg.thumbnail}
            alt=''
            onError={() => setImageError(true)}
          />
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
