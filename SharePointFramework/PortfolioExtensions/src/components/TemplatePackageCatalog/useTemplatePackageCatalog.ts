import { useEffect, useMemo, useRef, useState } from 'react'
import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import { ICatalogPackage, ICompatibilityReport, ICrossReference, PpPkgType } from 'models'
import {
  CatalogService,
  featureFlags,
  TemplateOptionsService,
  PackageInstaller,
  ProjectExtensionsService,
  TelemetryService
} from 'services'
import { isNewerVersion } from 'services/version'
import SPDataAdapter from 'data/SPDataAdapter'
import {
  ALL_FILTER,
  ICatalogFilters,
  ITemplatePackageCatalogContext,
  ITemplatePackageCatalogProps,
  RenderMode,
  SortKey
} from './types'
import { packageLanguageGroups } from './language'
import { useTemplatePackageCatalogState } from './useTemplatePackageCatalogState'

// Combining-diacritical-marks block (U+0300–U+036F): the accents left behind
// after NFD-decomposing a string. Stripped via a code-point check rather than a
// regex character class (which would trip `no-misleading-character-class`).
const COMBINING_MARK_MIN = 0x0300
const COMBINING_MARK_MAX = 0x036f

// Letters with no NFD canonical decomposition (ø, æ, …) need an explicit
// transliteration fold. Applied after toLowerCase(), so the lowercase-only map
// also covers Ø/Æ. (å is NOT needed here — NFD decomposes it to a + U+030A.)
const LETTER_FOLDS: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss'
}
const LETTER_FOLDS_PATTERN = /[øæœß]/g

/**
 * Fold a string for diacritic-insensitive search: decompose, drop combining
 * marks, lower-case, then transliterate letters NFD can't decompose (ø→o,
 * æ→ae). So "anlegg" matches "Anlégg" and "leverandor" matches
 * "Leverandørsamhandling". Applied to both the query and the haystack, so
 * "leverandør" keeps matching too. Avoids `\p{Diacritic}`/the `u`-flag for a
 * safe SPFx TS target.
 */
const normalize = (value: string): string => {
  let folded = ''
  for (const char of value.normalize('NFD')) {
    const code = char.charCodeAt(0)
    if (code < COMBINING_MARK_MIN || code > COMBINING_MARK_MAX) folded += char
  }
  return folded.toLowerCase().replace(LETTER_FOLDS_PATTERN, (letter) => LETTER_FOLDS[letter])
}

/**
 * Loads catalog and installation matches, filters and sorts packages, and coordinates package actions.
 */
export function useTemplatePackageCatalog(
  props: ITemplatePackageCatalogProps
): ITemplatePackageCatalogContext {
  const { state, setState } = useTemplatePackageCatalogState()
  // Holds the resolver of the in-flight compatibility-conflict prompt, settled
  // by the CompatibilityDialog via resolveCompatibility().
  const conflictResolver = useRef<(proceed: boolean) => void>()
  const [reloadToken, setReloadToken] = useState(0)
  const reloadCatalog = () => setReloadToken((token) => token + 1)
  const [open, setOpen] = useState(true)
  const close = (): void => {
    setOpen(false)
    props.onDismiss()
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      // On a manual retry, drop back to the loading state and clear the old
      // degraded banner while the fetch runs.
      if (reloadToken > 0) setState({ loading: true, degraded: false, error: undefined })
      const { catalog, degraded, error, fromCache } = await CatalogService.getCatalog(
        props.catalogUrl
      )
      let crossRef = new Map<string, ICrossReference>()
      try {
        const items = await TemplateOptionsService.getItems()
        crossRef = TemplateOptionsService.buildCrossReference(items, catalog)
      } catch {
        // Cross-reference is optional (fields may not be provisioned yet).
      }
      try {
        const extRef = await ProjectExtensionsService.getCrossReference(catalog)
        extRef.forEach((value, key) => crossRef.set(key, value))
      } catch {
        // Extension cross-reference is best-effort.
      }
      let installedVersion: string | undefined
      try {
        installedVersion = (await SPDataAdapter.getInstalledPPVersion()) ?? undefined
      } catch {
        // Installed version is best-effort — packages stay compatible if unknown.
      }
      if (cancelled) return
      setState({ loading: false, catalog, degraded, error, crossRef, installedVersion })

      // Stale-while-revalidate: a cached catalog was shown immediately above;
      // refresh it from the network in the background and swap in fresh data.
      if (fromCache) {
        const fresh = await CatalogService.revalidateCatalog(props.catalogUrl)
        if (!cancelled && fresh) setState({ catalog: fresh, degraded: false, error: undefined })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [props.catalogUrl, reloadToken])

  // Staged packages are excluded from all derived lists unless the debug flag is enabled.
  const showHidden = featureFlags.showHiddenPackages()
  const allPackages = useMemo(
    () => (state.catalog?.packages ?? []).filter((pkg) => showHidden || !pkg.hidden),
    [state.catalog, showHidden]
  )

  const categories = useMemo(() => {
    const set = new Set<string>()
    allPackages.forEach((pkg) => (pkg.tags ?? []).forEach((tag) => set.add(tag)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [allPackages])

  // Distinct available-language groups (nb/en/…) across the catalog. Norwegian
  // and English lead; the toolbar only shows the filter when more than one.
  const languages = useMemo(() => {
    const set = new Set<string>()
    allPackages.forEach((pkg) => packageLanguageGroups(pkg.languages).forEach((g) => set.add(g)))
    const lead = ['nb', 'en']
    return Array.from(set).sort((a, b) => {
      const rank = (g: string) => (lead.indexOf(g) === -1 ? lead.length : lead.indexOf(g))
      return rank(a) - rank(b) || a.localeCompare(b)
    })
  }, [allPackages])

  const crossRefFor = (packageId: string): ICrossReference | undefined =>
    state.crossRef.get(packageId.toLowerCase())

  // A package is supported unless its minPPVersion is newer than the installed
  // Prosjektportalen version. Unknown installed version → treated as supported.
  const isSupported = (pkg: ICatalogPackage): boolean =>
    !pkg.minPPVersion ||
    !state.installedVersion ||
    !isNewerVersion(pkg.minPPVersion, state.installedVersion)

  const filteredPackages = useMemo(() => {
    const {
      search,
      type,
      categories: selectedCategories,
      status,
      language,
      compatibleOnly
    } = state.filters
    const term = normalize(search.trim())
    const result = allPackages.filter((pkg) => {
      if (type !== ALL_FILTER && pkg.type !== type) return false
      // Multi-select categories: a package matches if it carries ANY of the
      // selected tags (OR semantics); empty selection = all.
      if (
        selectedCategories.length > 0 &&
        !(pkg.tags ?? []).some((tag) => selectedCategories.includes(tag))
      ) {
        return false
      }
      if (status !== 'all') {
        const ref = state.crossRef.get(pkg.id.toLowerCase())
        if (status === 'update') {
          if (!ref?.updateAvailable) return false
        } else if (!ref || ref.packageType !== status) {
          return false
        }
      }
      if (language !== ALL_FILTER && !packageLanguageGroups(pkg.languages).includes(language)) {
        return false
      }
      if (compatibleOnly && !isSupported(pkg)) return false
      if (term) {
        const haystack = normalize(
          [pkg.name, pkg.description, ...(pkg.tags ?? [])].filter(Boolean).join(' ')
        )
        if (!haystack.includes(term)) return false
      }
      return true
    })
    result.sort((a, b) => {
      if (state.sort === 'name') return a.name.localeCompare(b.name)
      const da = a.publishedDate ?? ''
      const db = b.publishedDate ?? ''
      if (da !== db) return db.localeCompare(da)
      return a.name.localeCompare(b.name)
    })
    return result
    // `isSupported` reads `state.installedVersion`, so depend on it explicitly.
  }, [allPackages, state.filters, state.sort, state.crossRef, state.installedVersion])

  const selectedPackage = allPackages.find((pkg) => pkg.id === state.selectedPackageId)

  // Default-select the first package (per the current filters/sort) once the
  // catalog has loaded, so the drawer opens with details showing instead of an
  // empty pane. Never overrides an existing selection, and deliberately does
  // NOT set `detailOpen` — the <720px collapsed layout stays on the list, and
  // the details pane skips its select-focus behavior for this implicit
  // selection (see usePackageDetails).
  useEffect(() => {
    if (state.loading || state.selectedPackageId) return
    const first = filteredPackages[0]
    if (first) setState({ selectedPackageId: first.id })
  }, [state.loading, filteredPackages])

  // Cleared/default filter state — `template` stays selected, everything else
  // off. Shared by clearFilters() and the active-filter detection below.
  const defaultFilters: ICatalogFilters = {
    search: '',
    type: 'template',
    categories: [],
    status: 'all',
    language: ALL_FILTER,
    compatibleOnly: false
  }

  const activeFilterCount =
    (state.filters.search.trim() !== '' ? 1 : 0) +
    (state.filters.type !== defaultFilters.type ? 1 : 0) +
    (state.filters.categories.length > 0 ? 1 : 0) +
    (state.filters.status !== defaultFilters.status ? 1 : 0) +
    (state.filters.language !== defaultFilters.language ? 1 : 0) +
    (state.filters.compatibleOnly ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  const setFilter = (key: keyof ICatalogFilters, value: string) =>
    setState((current) => ({ filters: { ...current.filters, [key]: value } }))

  const setCompatibleOnly = (value: boolean) =>
    setState((current) => ({ filters: { ...current.filters, compatibleOnly: value } }))

  const setCategories = (categories: string[]) =>
    setState((current) => ({ filters: { ...current.filters, categories } }))

  const clearFilters = () => setState({ filters: { ...defaultFilters } })

  const setSort = (sort: SortKey) => setState({ sort })
  const setRenderMode = (renderMode: RenderMode) => setState({ renderMode })
  const setSelected = (packageId: string) =>
    setState({ selectedPackageId: packageId, detailOpen: true, installProgress: undefined })
  const closeDetail = () => setState({ detailOpen: false })

  const refreshCrossRef = async (): Promise<void> => {
    if (!state.catalog) return
    try {
      const items = await TemplateOptionsService.getItems()
      const crossRef = TemplateOptionsService.buildCrossReference(items, state.catalog)
      try {
        const extRef = await ProjectExtensionsService.getCrossReference(state.catalog)
        extRef.forEach((value, key) => crossRef.set(key, value))
      } catch {
        // Extension cross-reference is best-effort.
      }
      setState({ crossRef })
    } catch {
      // ignore
    }
  }

  const importPackage = async (pkg: ICatalogPackage): Promise<void> => {
    setState({
      notification: undefined,
      installProgress: { steps: [], status: 'running', log: [] }
    })
    // Snapshot BEFORE the install: refreshCrossRef() below overwrites the
    // cross-reference, and its prior presence is what discriminates a fresh
    // install from an update (for both the installer and telemetry). Only a
    // local install is overwritten: a cloud template's registration (Sentral)
    // stays one, and the copy is added beside it.
    const ref = crossRefFor(pkg.id)
    const priorRef = ref?.packageType === PpPkgType.Importert ? ref : undefined
    const action = priorRef?.itemId ? ('update' as const) : ('install' as const)
    try {
      const { completed, errors } = await PackageInstaller.runImport({
        package: pkg,
        context: props.context,
        featureFlagProvisioning: props.featureFlagProvisioning,
        existingItemId: priorRef?.itemId,
        onProgress: (installProgress) => setState({ installProgress }),
        // Surface compatibility conflicts via the dialog and pause on the
        // awaited promise until the admin chooses Avbryt / Fortsett likevel.
        onConflicts: (report: ICompatibilityReport) =>
          new Promise<boolean>((resolve) => {
            conflictResolver.current = resolve
            setState({ compatibilityReport: report })
          })
      })
      // Cancelled at the compatibility prompt — the progress pane already shows
      // the cancelled state; don't report success (and no telemetry event).
      if (!completed) return
      await refreshCrossRef()
      void TelemetryService.track(props, {
        action,
        status: 'success',
        packageId: pkg.id,
        packageVersion: pkg.version,
        packageType: pkg.type,
        previousVersion: priorRef?.installedVersion,
        ppVersion: state.installedVersion
      })
      // Errors sp-js-provisioning logged and went on after: the progress pane's
      // advanced log lists them.
      setState({
        notification:
          errors.length > 0
            ? {
                intent: 'warning',
                text: format(strings.CatalogInstallWarningText, errors.length)
              }
            : {
                intent: 'success',
                text:
                  pkg.type === 'extension'
                    ? strings.CatalogInstallSuccessTextExtension
                    : strings.CatalogInstallSuccessText
              }
      })
    } catch (error) {
      void TelemetryService.track(props, {
        action,
        status: 'error',
        errorMessage: error?.message,
        packageId: pkg.id,
        packageVersion: pkg.version,
        packageType: pkg.type,
        previousVersion: priorRef?.installedVersion,
        ppVersion: state.installedVersion
      })
      setState({
        notification: { intent: 'error', text: error?.message || strings.CatalogInstallErrorTitle }
      })
    }
  }

  /**
   * Provisions a cloud template's hub dependencies and registers it in Maloppsett: as a new
   * registration, or, given the package's registration (`ref`), by updating that one in place to
   * the package's version, so it stays a cloud template.
   */
  const provisionCloudTemplate = async (
    pkg: ICatalogPackage,
    ref?: ICrossReference
  ): Promise<void> => {
    const texts = ref
      ? {
          success: format(strings.CatalogUpdateCentralSuccessText, pkg.version),
          taxonomySkipped: format(strings.CatalogUpdateCentralTaxonomySkippedText, pkg.version),
          cancelled: strings.CatalogUpdateCentralCancelledText,
          error: strings.CatalogUpdateCentralErrorText
        }
      : {
          success: strings.CatalogPublishSuccessText,
          taxonomySkipped: strings.CatalogPublishTaxonomySkippedText,
          cancelled: strings.CatalogPublishCancelledText,
          error: strings.CatalogPublishErrorText
        }
    setState({ notification: undefined, busyAction: 'publish' })
    try {
      // A cloud template's hub dependencies are provisioned now, in this admin
      // context — site columns, content types (with their Prosjekter /
      // Prosjektstatus bindings), hub configuration rows and, feature-flag
      // gated like the import flow, taxonomy — so projects later created from
      // the cloud template are recognized by the portfolio. Project-level
      // content (template, extensions, list content incl. folder structures)
      // is still pulled from the .pppkg at project-setup time.
      const result = await PackageInstaller.provisionCloudTemplateHubDependencies(
        pkg,
        props.context,
        {
          featureFlagProvisioning: props.featureFlagProvisioning,
          // Surface compatibility conflicts via the dialog and pause on the
          // awaited promise until the admin chooses Avbryt / Fortsett likevel.
          onConflicts: (report: ICompatibilityReport) =>
            new Promise<boolean>((resolve) => {
              conflictResolver.current = resolve
              setState({ compatibilityReport: report })
            })
        }
      )
      // Cancelled at the compatibility prompt — nothing was written.
      if (!result.completed) {
        setState({ notification: { intent: 'warning', text: texts.cancelled } })
        return
      }
      const options = {
        projectContentTypeId: result.manifest.provisioning?.projectContentTypeId,
        projectStatusContentTypeId: result.manifest.provisioning?.projectStatusContentTypeId,
        projectPhaseTermSetId: result.manifest.provisioning?.projectPhaseTermSetId,
        name: result.localizedName,
        description: result.localizedDescription
      }
      if (ref) await TemplateOptionsService.updateCentral(ref.itemId, pkg, options)
      else await TemplateOptionsService.createCentral(pkg, options)
      await refreshCrossRef()
      // The version updated from tells an update from a first publish.
      void TelemetryService.track(props, {
        action: 'publishCentral',
        status: 'success',
        packageId: pkg.id,
        packageVersion: pkg.version,
        packageType: pkg.type,
        previousVersion: ref?.installedVersion,
        ppVersion: state.installedVersion,
        detail: { taxonomySkipped: result.taxonomySkipped }
      })
      const publishedText = result.taxonomySkipped ? texts.taxonomySkipped : texts.success
      // Publishing has no advanced log: the errors sp-js-provisioning logged and went
      // on after are listed in the notification.
      setState({
        notification:
          result.errors.length > 0
            ? {
                intent: 'warning',
                text: format(strings.CatalogPublishErrorsText, publishedText, result.errors.length),
                details: { label: strings.CatalogPublishErrorsLabel, lines: result.errors }
              }
            : { intent: result.taxonomySkipped ? 'warning' : 'success', text: publishedText }
      })
    } catch (error) {
      void TelemetryService.track(props, {
        action: 'publishCentral',
        status: 'error',
        errorMessage: error?.message,
        packageId: pkg.id,
        packageVersion: pkg.version,
        packageType: pkg.type,
        previousVersion: ref?.installedVersion,
        ppVersion: state.installedVersion
      })
      setState({ notification: { intent: 'error', text: error?.message || texts.error } })
    } finally {
      setState({ busyAction: undefined })
    }
  }

  const publishCentral = (pkg: ICatalogPackage): Promise<void> => provisionCloudTemplate(pkg)

  const updateCentral = async (pkg: ICatalogPackage): Promise<void> => {
    const ref = crossRefFor(pkg.id)
    // A local install is never turned into a cloud template here.
    if (ref?.packageType !== PpPkgType.Sentral) return
    await provisionCloudTemplate(pkg, ref)
  }

  const resolveCompatibility = (proceed: boolean): void => {
    setState({ compatibilityReport: undefined })
    const resolve = conflictResolver.current
    conflictResolver.current = undefined
    resolve?.(proceed)
  }

  const removePackage = async (pkg: ICatalogPackage): Promise<void> => {
    const ref = crossRefFor(pkg.id)
    if (!ref) return
    setState({ notification: undefined, busyAction: 'remove' })
    try {
      // An extension's cross-ref itemId points at the Prosjekttillegg library,
      // not Maloppsett — route the delete to the right list. Maloppsett answers
      // false when it refused the removal, where the library throws: the refusal
      // was told and tracked as a success.
      const removed =
        pkg.type === 'extension'
          ? await ProjectExtensionsService.remove(ref.itemId).then(() => true)
          : await TemplateOptionsService.remove(ref.itemId)
      if (!removed) throw new Error(strings.CatalogRemoveErrorText)
      await refreshCrossRef()
      void TelemetryService.track(props, {
        action: 'remove',
        status: 'success',
        packageId: pkg.id,
        packageVersion: pkg.version,
        packageType: pkg.type,
        previousVersion: ref.installedVersion,
        ppVersion: state.installedVersion,
        detail: { removedType: ref.packageType }
      })
      setState({
        notification: {
          intent: 'success',
          text:
            pkg.type === 'extension'
              ? strings.CatalogRemoveSuccessTextExtension
              : strings.CatalogRemoveSuccessText
        }
      })
    } catch (error) {
      void TelemetryService.track(props, {
        action: 'remove',
        status: 'error',
        errorMessage: error?.message,
        packageId: pkg.id,
        packageVersion: pkg.version,
        packageType: pkg.type,
        previousVersion: ref.installedVersion,
        ppVersion: state.installedVersion
      })
      setState({
        notification: {
          intent: 'error',
          text:
            error?.message ||
            (pkg.type === 'extension'
              ? strings.CatalogRemoveErrorTextExtension
              : strings.CatalogRemoveErrorText)
        }
      })
    } finally {
      setState({ busyAction: undefined })
    }
  }

  return {
    props,
    state,
    setState,
    open,
    close,
    filteredPackages,
    categories,
    languages,
    activeFilterCount,
    hasActiveFilters,
    selectedPackage,
    crossRefFor,
    isSupported,
    setFilter,
    setCompatibleOnly,
    setCategories,
    clearFilters,
    reloadCatalog,
    setSort,
    setRenderMode,
    setSelected,
    closeDetail,
    importPackage,
    publishCentral,
    updateCentral,
    removePackage,
    resolveCompatibility
  }
}
