import { format } from '@fluentui/react/lib/Utilities'
import { Button, Caption1, Tag, TagGroup, Text } from '@fluentui/react-components'
import {
  ArrowDownload24Regular,
  ArrowLeft24Regular,
  Cloud24Regular,
  Delete24Regular
} from '@fluentui/react-icons'
import { UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useState } from 'react'
import { PpPkgType } from 'models'
import { PackageBadges } from '../PackageCard'
import { useCatalogContext } from '../context'
import { PackageContentSummary } from './PackageContentSummary'
import { PackageHistory } from './PackageHistory'
import styles from './PackageDetails.module.scss'

export const PackageDetails: FC = () => {
  const {
    selectedPackage,
    crossRefFor,
    importPackage,
    publishCentral,
    removePackage,
    closeDetail
  } = useCatalogContext()
  const [imageError, setImageError] = useState(false)

  if (!selectedPackage) {
    return (
      <div className={styles.empty}>
        <UserMessage intent='info' text={strings.CatalogDetailsEmptyText} />
      </div>
    )
  }

  const pkg = selectedPackage
  const ref = crossRefFor(pkg.id)
  const isCentral = ref?.packageType === PpPkgType.Sentral
  const updateAvailable = !!ref?.updateAvailable

  const meta = [
    pkg.version ? `v${pkg.version}` : undefined,
    pkg.publishedDate ? format(strings.CatalogCardPublished, pkg.publishedDate) : undefined,
    pkg.author ? format(strings.CatalogCardByAuthor, pkg.author) : undefined
  ]
    .filter(Boolean)
    .join('  •  ')

  return (
    <div className={styles.root}>
      <Button
        className={styles.backButton}
        appearance='subtle'
        icon={<ArrowLeft24Regular />}
        onClick={closeDetail}
      >
        {strings.CatalogBackToListText}
      </Button>

      {pkg.thumbnail && !imageError && (
        <img
          className={styles.thumbnail}
          src={pkg.thumbnail}
          alt=''
          onError={() => setImageError(true)}
        />
      )}

      <div className={styles.titleRow}>
        <Text size={500} weight='semibold'>
          {pkg.name}
        </Text>
        <PackageBadges packageId={pkg.id} />
      </div>

      <Caption1 className={styles.meta}>{meta}</Caption1>

      {pkg.description && <Text className={styles.description}>{pkg.description}</Text>}

      {(pkg.tags?.length ?? 0) > 0 && (
        <TagGroup className={styles.tags}>
          {pkg.tags?.map((tag) => (
            <Tag key={tag} size='small' appearance='outline'>
              {tag}
            </Tag>
          ))}
        </TagGroup>
      )}

      <PackageContentSummary package={pkg} />

      <PackageHistory changelogUrl={pkg.changelogUrl} />

      <div className={styles.actions}>
        <Button
          appearance='primary'
          icon={<ArrowDownload24Regular />}
          onClick={() => importPackage(pkg)}
        >
          {updateAvailable
            ? format(strings.CatalogActionUpdate, pkg.version)
            : strings.CatalogActionImport}
        </Button>
        {!isCentral && (
          <Button
            appearance='secondary'
            icon={<Cloud24Regular />}
            onClick={() => publishCentral(pkg)}
          >
            {strings.CatalogActionPublishCentral}
          </Button>
        )}
        {ref && (
          <Button appearance='subtle' icon={<Delete24Regular />} onClick={() => removePackage(pkg)}>
            {strings.CatalogActionRemove}
          </Button>
        )}
      </div>
    </div>
  )
}
