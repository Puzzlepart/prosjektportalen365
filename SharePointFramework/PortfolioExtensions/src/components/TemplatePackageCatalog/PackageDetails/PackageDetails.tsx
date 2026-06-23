import { format } from '@fluentui/react/lib/Utilities'
import { formatDate, getFluentIconWithFallback } from 'pp365-shared-library'
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
  Spinner,
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
import React, { FC } from 'react'
import { PpPkgType } from 'models'
import { PackageBadges, PackageRequirementTags } from '../PackageCard'
import { PackageContentSummary } from './PackageContentSummary'
import { PackageHistory } from './PackageHistory'
import { PackageScreenshots } from './PackageScreenshots'
import styles from './PackageDetails.module.scss'
import { usePackageDetails } from './usePackageDetails'

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
    imageError,
    onImageError,
    confirmReplace,
    setConfirmReplace,
    confirmCloud,
    setConfirmCloud,
    confirmRemove,
    setConfirmRemove,
    rootRef,
    filterByTag
  } = usePackageDetails()

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
    pkg.publishedDate
      ? format(strings.CatalogCardPublished, formatDate(pkg.publishedDate))
      : undefined,
    pkg.author ? format(strings.CatalogCardByAuthor, pkg.author) : undefined
  ]
    .filter(Boolean)
    .join('  •  ')

  return (
    <div className={styles.root} ref={rootRef} tabIndex={-1}>
      <Button
        className={styles.backButton}
        appearance='subtle'
        icon={<ArrowLeft24Regular />}
        onClick={closeDetail}
      >
        {strings.CatalogBackToListText}
      </Button>

      {pkg.thumbnail && !imageError && (
        <img className={styles.thumbnail} src={pkg.thumbnail} alt='' onError={onImageError} />
      )}

      <div className={styles.titleRow}>
        {pkg.icon && (
          <span className={styles.titleIcon}>{getFluentIconWithFallback(pkg.icon)}</span>
        )}
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
              <Tooltip
                content={format(strings.CatalogTagFilterTooltip, tag)}
                relationship='description'
              >
                <InteractionTagPrimary onClick={() => filterByTag(tag)}>
                  {tag}
                </InteractionTagPrimary>
              </Tooltip>
            </InteractionTag>
          ))}
        </TagGroup>
      )}

      <PackageRequirementTags package={pkg} />
      <PackageScreenshots screenshots={pkg.screenshots} />
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
            disabled={!supported || !!state.busyAction}
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
              disabled={!!state.busyAction}
              icon={state.busyAction === 'publish' ? <Spinner size='tiny' /> : <Cloud24Regular />}
              onClick={() =>
                pkg.cloudCompatible === false ? setConfirmCloud(true) : publishCentral(pkg)
              }
            >
              {strings.CatalogActionPublishCentral}
            </Button>
          </Tooltip>
        )}
        {ref && !isExtension && (
          <Tooltip content={strings.CatalogActionRemoveTooltip} relationship='description'>
            <Button
              appearance='subtle'
              disabled={!!state.busyAction}
              icon={state.busyAction === 'remove' ? <Spinner size='tiny' /> : <Delete24Regular />}
              onClick={() => setConfirmRemove(true)}
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

      <Dialog
        open={confirmCloud}
        onOpenChange={(_, data) => {
          if (!data.open) setConfirmCloud(false)
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{strings.CatalogPublishCloudWarningTitle}</DialogTitle>
            <DialogContent>
              {format(strings.CatalogPublishCloudWarningText, pkg.name)}
            </DialogContent>
            <DialogActions>
              <Button appearance='secondary' onClick={() => setConfirmCloud(false)}>
                {strings.CancelLabel}
              </Button>
              <Button
                appearance='primary'
                onClick={() => {
                  setConfirmCloud(false)
                  void publishCentral(pkg)
                }}
              >
                {strings.CatalogPublishCloudWarningConfirm}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={confirmRemove}
        onOpenChange={(_, data) => {
          if (!data.open) setConfirmRemove(false)
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{strings.CatalogRemoveConfirmTitle}</DialogTitle>
            <DialogContent>{format(strings.CatalogRemoveConfirmText, pkg.name)}</DialogContent>
            <DialogActions>
              <Button appearance='secondary' onClick={() => setConfirmRemove(false)}>
                {strings.CancelLabel}
              </Button>
              <Button
                appearance='primary'
                onClick={() => {
                  setConfirmRemove(false)
                  void removePackage(pkg)
                }}
              >
                {strings.CatalogRemoveConfirmButton}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
