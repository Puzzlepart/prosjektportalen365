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
import { PackageBadges, PackageHiddenTag, PackageRequirementTags } from '../PackageCard'
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
  // A non-cloud-compatible package can't be published as a cloud template — the
  // publish button is shown disabled with the reason in its tooltip.
  const notCloudCompatible = pkg.cloudCompatible === false
  const supported = isSupported(pkg)
  // Same-named extension exists locally but wasn't installed from the catalog —
  // replacing it needs an explicit confirmation.
  const isUnmanaged = !!ref?.unmanaged
  // Imported from the catalog at the latest version: the primary action reads
  // as an explicit reinstall/overwrite instead of a fresh install, so the UI
  // reflects that the package is already in place. (`Sentral` refs keep the
  // plain import label — copying locally is a separate action from publishing
  // as a cloud template.)
  const isUpToDate = ref?.packageType === PpPkgType.Importert && !isUnmanaged && !updateAvailable
  // What the remove buttons can act on: the single cross-referenced
  // registration is either a local install (Importert) or a cloud registration
  // (Sentral) — each remove button enables only for its own kind. Unmanaged
  // (hand-made) extensions must not be deletable from here.
  const canRemoveInstall = isExtension
    ? !!ref && !isUnmanaged
    : ref?.packageType === PpPkgType.Importert
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
        <div className={styles.titleGroup}>
          {pkg.icon && (
            <span className={styles.titleIcon}>{getFluentIconWithFallback(pkg.icon)}</span>
          )}
          <Text size={500} weight='semibold' className={styles.titleText}>
            {pkg.name}
          </Text>
        </div>
        <PackageBadges packageId={pkg.id} />
        <PackageHiddenTag package={pkg} />
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
                : isUpToDate
                ? format(
                    strings.CatalogActionReinstallExtensionTooltip,
                    ref?.installedVersion || pkg.version
                  )
                : strings.CatalogActionAddExtensionTooltip
              : updateAvailable
              ? strings.CatalogActionUpdateTooltip
              : isUpToDate
              ? format(strings.CatalogActionReinstallTooltip, ref?.installedVersion || pkg.version)
              : strings.CatalogActionImportTooltip
          }
          relationship='description'
        >
          <Button
            className={styles.mainAction}
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
                : isUpToDate
                ? strings.CatalogActionReinstallExtension
                : strings.CatalogActionAddExtension
              : updateAvailable
              ? format(strings.CatalogActionUpdate, pkg.version)
              : isUpToDate
              ? strings.CatalogActionReinstall
              : strings.CatalogActionImport}
          </Button>
        </Tooltip>
        {/* Row 1's remove: the local install (or the extension file). Only
            rendered when there is an install to remove. */}
        {canRemoveInstall && (
          <Tooltip
            content={
              isExtension
                ? strings.CatalogActionRemoveTooltipExtension
                : strings.CatalogActionRemoveTooltip
            }
            relationship='description'
          >
            <Button
              className={styles.removeAction}
              appearance='subtle'
              disabled={!!state.busyAction}
              icon={state.busyAction === 'remove' ? <Spinner size='tiny' /> : <Delete24Regular />}
              onClick={() => setConfirmRemove(true)}
            >
              {isExtension ? strings.CatalogActionRemove : strings.CatalogActionRemoveImport}
            </Button>
          </Tooltip>
        )}

        {/* Row 2 — cloud template (templates only): publish + its remove (only
            when registered as a cloud template). */}
        {!isExtension && (
          <>
            <Tooltip
              content={
                isCentral
                  ? strings.CatalogActionPublishCentralAlreadyTooltip
                  : notCloudCompatible
                  ? pkg.cloudCompatibleReason ??
                    strings.CatalogActionPublishCentralIncompatibleTooltip
                  : strings.CatalogActionPublishCentralTooltip
              }
              relationship='description'
            >
              <Button
                className={styles.mainAction}
                appearance='secondary'
                disabled={!!state.busyAction}
                disabledFocusable={notCloudCompatible || isCentral}
                icon={state.busyAction === 'publish' ? <Spinner size='tiny' /> : <Cloud24Regular />}
                onClick={() => publishCentral(pkg)}
              >
                {strings.CatalogActionPublishCentral}
              </Button>
            </Tooltip>
            {isCentral && (
              <Tooltip
                content={strings.CatalogActionRemoveCentralTooltip}
                relationship='description'
              >
                <Button
                  className={styles.removeAction}
                  appearance='subtle'
                  disabled={!!state.busyAction}
                  icon={
                    state.busyAction === 'remove' ? <Spinner size='tiny' /> : <Delete24Regular />
                  }
                  onClick={() => setConfirmRemove(true)}
                >
                  {strings.CatalogActionRemoveCentral}
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </div>

      <PackageHistory changelogUrl={pkg.changelogUrl} />

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
        open={confirmRemove}
        onOpenChange={(_, data) => {
          if (!data.open) setConfirmRemove(false)
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {isExtension
                ? strings.CatalogRemoveConfirmTitleExtension
                : strings.CatalogRemoveConfirmTitle}
            </DialogTitle>
            <DialogContent>
              {format(
                isExtension
                  ? strings.CatalogRemoveConfirmTextExtension
                  : strings.CatalogRemoveConfirmText,
                pkg.name
              )}
            </DialogContent>
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
