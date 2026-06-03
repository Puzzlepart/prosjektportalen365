import { format } from '@fluentui/react/lib/Utilities'
import {
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  mergeClasses,
  Tag,
  TagGroup,
  Text
} from '@fluentui/react-components'
import { Apps24Regular } from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useState } from 'react'
import { ICatalogPackage } from '../../models'
import { useCatalogContext } from '../TemplatePackageCatalog/context'
import { PackageBadges } from './PackageBadges'
import styles from './PackageCard.module.scss'

export interface IPackageCardProps {
  package: ICatalogPackage
}

export const PackageCard: FC<IPackageCardProps> = ({ package: pkg }) => {
  const { state, setSelected } = useCatalogContext()
  const [imageError, setImageError] = useState(false)
  const isSelected = state.selectedPackageId === pkg.id

  const meta = [
    pkg.version ? `v${pkg.version}` : undefined,
    pkg.publishedDate ? format(strings.CatalogCardPublished, pkg.publishedDate) : undefined,
    pkg.author ? format(strings.CatalogCardByAuthor, pkg.author) : undefined
  ]
    .filter(Boolean)
    .join('  •  ')

  return (
    <Card
      className={mergeClasses(styles.card, isSelected && styles.selected)}
      role="listitem"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => setSelected(pkg.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setSelected(pkg.id)
        }
      }}
    >
      <CardPreview className={styles.preview}>
        {pkg.thumbnail && !imageError ? (
          <img
            className={styles.previewImage}
            src={pkg.thumbnail}
            alt=""
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={styles.placeholder}>
            <Apps24Regular />
          </span>
        )}
      </CardPreview>
      <CardHeader
        header={<Text weight="semibold">{pkg.name}</Text>}
        description={
          <div className={styles.badges}>
            <PackageBadges packageId={pkg.id} />
          </div>
        }
      />
      {pkg.description && (
        <Text size={200} className={styles.description}>
          {pkg.description}
        </Text>
      )}
      {(pkg.tags?.length ?? 0) > 0 && (
        <TagGroup>
          {pkg.tags?.map((tag) => (
            <Tag key={tag} size="extra-small" appearance="outline">
              {tag}
            </Tag>
          ))}
        </TagGroup>
      )}
      <Caption1 className={styles.footer}>{meta}</Caption1>
    </Card>
  )
}
