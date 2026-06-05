import { format } from '@fluentui/react/lib/Utilities'
import { Icon } from '@fluentui/react/lib/Icon'
import { formatDate } from 'pp365-shared-library'
import {
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
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
    state,
    selectedPackage,
    crossRefFor,
    isSupported,
    importPackage,
    publishCentral,
    removePackage,
    closeDetail,
    setFilter
  } = useCatalogContext()
  const [imageError, setImageError] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)

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
  const supported = isSupported(pkg)
  // Same-named extension exists locally but wasn't installed from the catalog —
  // replacing it needs an explicit confirmation.
  const isUnmanaged = !!ref?.unmanaged
  const onPrimaryAction = () => (isUnmanaged ? setConfirmReplace(true) : importPackage(pkg))

  const meta = [
    pkg.version ? `v${pkg.version}` : undefined,
    pkg.publishedDate ? format(strings.CatalogCardPublished, formatDate(pkg.publishedDate)) : undefined,
    pkg.author ? format(strings.CatalogCardByAuthor, pkg.author) : undefined,
    pkg.minPPVersion ? format(strings.CatalogRequiresVersion, pkg.minPPVersion) : undefined
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
        {pkg.icon && <Icon iconName={pkg.icon} className={styles.titleIcon} />}
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

      {!supported && pkg.minPPVersion && (
        <UserMessage
          intent='warning'
          title={strings.CatalogIncompatibleTitle}
          text={format(
            strings.CatalogIncompatibleText,
            pkg.minPPVersion,
            state.installedVersion ?? '?'
          )}
        />
      )}

      <div className={styles.actions}>
        <Tooltip
          content={
            isExtension
              ? isUnmanaged
                ? strings.CatalogBadgeLocalTooltip
                : updateAvailable
                ? strings.CatalogActionUpdateTooltip
                : strings.CatalogActionAddExtensionTooltip
              : updateAvailable
              ? strings.CatalogActionUpdateTooltip
              : strings.CatalogActionImportTooltip
          }
          relationship='description'
        >
          <Button
            appearance='primary'
            disabled={!supported}
            icon={isExtension ? <PuzzlePiece24Regular /> : <ArrowDownload24Regular />}
            onClick={onPrimaryAction}
          >
            {isExtension
              ? isUnmanaged
                ? strings.CatalogActionReplaceExtension
                : updateAvailable
                ? format(strings.CatalogActionUpdateExtension, pkg.version)
                : strings.CatalogActionAddExtension
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
        {ref && !isExtension && (
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

      <Dialog
        open={confirmReplace}
        onOpenChange={(_, data) => {
          if (!data.open) setConfirmReplace(false)
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{strings.CatalogReplaceConfirmTitle}</DialogTitle>
            <DialogContent>
              {format(strings.CatalogReplaceConfirmText, pkg.name, pkg.version)}
            </DialogContent>
            <DialogActions>
              <Button appearance='secondary' onClick={() => setConfirmReplace(false)}>
                {strings.CancelLabel}
              </Button>
              <Button
                appearance='primary'
                onClick={() => {
                  setConfirmReplace(false)
                  void importPackage(pkg)
                }}
              >
                {strings.CatalogReplaceConfirmButton}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
