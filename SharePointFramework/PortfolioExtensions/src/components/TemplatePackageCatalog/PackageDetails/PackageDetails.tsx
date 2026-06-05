import { format } from '@fluentui/react/lib/Utilities'
import {
  Button,
  Caption1,
  InteractionTag,
  InteractionTagPrimary,
  TagGroup,
  Text,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowDownload24Regular,
  ArrowLeft24Regular,
  Cloud24Regular,
  Delete24Regular,
  PuzzlePiece24Regular
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
    closeDetail,
    setFilter
  } = useCatalogContext()
  const [imageError, setImageError] = useState(false)

  // Clicking a tag filters the catalog by that category and returns to the list.
  const filterByTag = (tag: string) => {
    setFilter('category', tag)
    closeDetail()
  }

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
  // Extensions go into the Prosjekttillegg library, not Maloppsett, so they
  // cannot be published as a cloud template and get their own action/info copy.
  const isExtension = pkg.type === 'extension'
  const canPublishCentral = !isCentral && !isExtension

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
            <InteractionTag key={tag} value={tag} size='small' appearance='brand'>
              <Tooltip content={format(strings.CatalogTagFilterTooltip, tag)} relationship='description'>
                <InteractionTagPrimary onClick={() => filterByTag(tag)}>{tag}</InteractionTagPrimary>
              </Tooltip>
            </InteractionTag>
          ))}
        </TagGroup>
      )}

      <PackageContentSummary package={pkg} />

      <PackageHistory changelogUrl={pkg.changelogUrl} />

      {isExtension && <UserMessage intent='info' text={strings.CatalogExtensionInfo} />}

      <div className={styles.actions}>
        <Tooltip
          content={
            isExtension
              ? strings.CatalogActionAddExtensionTooltip
              : updateAvailable
              ? strings.CatalogActionUpdateTooltip
              : strings.CatalogActionImportTooltip
          }
          relationship='description'
        >
          <Button
            appearance='primary'
            icon={isExtension ? <PuzzlePiece24Regular /> : <ArrowDownload24Regular />}
            onClick={() => importPackage(pkg)}
          >
            {isExtension
              ? strings.CatalogActionAddExtension
              : updateAvailable
              ? format(strings.CatalogActionUpdate, pkg.version)
              : strings.CatalogActionImport}
          </Button>
        </Tooltip>
        {canPublishCentral && (
          <Tooltip content={strings.CatalogActionPublishCentralTooltip} relationship='description'>
            <Button
              appearance='secondary'
              icon={<Cloud24Regular />}
              onClick={() => publishCentral(pkg)}
            >
              {strings.CatalogActionPublishCentral}
            </Button>
          </Tooltip>
        )}
        {ref && (
          <Tooltip content={strings.CatalogActionRemoveTooltip} relationship='description'>
            <Button
              appearance='subtle'
              icon={<Delete24Regular />}
              onClick={() => removePackage(pkg)}
            >
              {strings.CatalogActionRemove}
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
