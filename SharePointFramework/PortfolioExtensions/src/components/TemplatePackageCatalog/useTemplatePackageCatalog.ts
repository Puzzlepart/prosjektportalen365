import { useEffect, useMemo, useRef, useState } from 'react'
import strings from 'PortfolioExtensionsStrings'
import { ICatalogPackage, ICompatibilityReport, ICrossReference } from 'models'
import {
  CatalogService,
  TemplateOptionsService,
  PackageInstaller,
  ProjectExtensionsService
} from 'services'
import { isNewerVersion } from 'services/version'
import SPDataAdapter from 'data/SPDataAdapter'
import {
  ALL_FILTER,
  ICatalogFilters,
  ITemplatePackageCatalogContext,
  ITemplatePackageCatalogProps,
  PAGE_SIZE,
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

/**
 * Fold a string for diacritic-insensitive search: decompose, drop combining
 * marks, lower-case. So "anlegg" matches "Anlégg" and accented names match
 * their plain spelling. Avoids `\p{Diacritic}`/the `u`-flag for a safe SPFx TS
 * target.
 */
const normalize = (value: string): string => {
  let folded = ''
  for (const char of value.normalize('NFD')) {
    const code = char.charCodeAt(0)
    if (code < COMBINING_MARK_MIN || code > COMBINING_MARK_MAX) folded += char
  }
  return folded.toLowerCase()
}

/**
 * Orchestrates the catalog: loads the catalog + Maloppsett cross-reference,
 * derives the filtered/sorted/paginated package list, and exposes the import /
 * publish-central / remove actions. Mirrors `useProvisionDrawer`.
 */
export function useTemplatePackageCatalog(
  props: ITemplatePackageCatalogProps
): ITemplatePackageCatalogContext {
  const { state, setState } = useTemplatePackageCatalogState()
  // Holds the resolver of the in-flight compatibility-conflict prompt, settled
  // by the CompatibilityDialog via resolveCompatibility().
  const conflictResolver = useRef<(proceed: boolean) => void>()
  // Bumped by reloadCatalog() to re-run the load effect (degraded-state retry).
  const [reloadToken, setReloadToken] = useState(0)
  const reloadCatalog = () => setReloadToken((token) => token + 1)

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

  const allPackages = state.catalog?.packages ?? []

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
    const { search, type, category, status, language, compatibleOnly } = state.filters
    const term = normalize(search.trim())
    const result = allPackages.filter((pkg) => {
      if (type !== ALL_FILTER && pkg.type !== type) return false
      if (category !== ALL_FILTER && !(pkg.tags ?? []).includes(category)) return false
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

  const pageCount = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE))
  const page = Math.min(state.page, pageCount)
  const pagedPackages = filteredPackages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedPackage = allPackages.find((pkg) => pkg.id === state.selectedPackageId)

  // Cleared/default filter state — `template` stays selected, everything else
  // off. Shared by clearFilters() and the active-filter detection below.
  const defaultFilters: ICatalogFilters = {
    search: '',
    type: 'template',
    category: ALL_FILTER,
    status: 'all',
    language: ALL_FILTER,
    compatibleOnly: false
  }

  const activeFilterCount =
    (state.filters.search.trim() !== '' ? 1 : 0) +
    (state.filters.type !== defaultFilters.type ? 1 : 0) +
    (state.filters.category !== defaultFilters.category ? 1 : 0) +
    (state.filters.status !== defaultFilters.status ? 1 : 0) +
    (state.filters.language !== defaultFilters.language ? 1 : 0) +
    (state.filters.compatibleOnly ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  const setFilter = (key: keyof ICatalogFilters, value: string) =>
    setState((current) => ({ filters: { ...current.filters, [key]: value }, page: 1 }))

  const setCompatibleOnly = (value: boolean) =>
    setState((current) => ({ filters: { ...current.filters, compatibleOnly: value }, page: 1 }))

  const clearFilters = () => setState({ filters: { ...defaultFilters }, page: 1 })

  const setSort = (sort: SortKey) => setState({ sort, page: 1 })
  const setRenderMode = (renderMode: RenderMode) => setState({ renderMode })
  const setSelected = (packageId: string) =>
    setState({ selectedPackageId: packageId, detailOpen: true, installProgress: undefined })
  const setPage = (newPage: number) => setState({ page: newPage })
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
    setState({ notification: undefined, installProgress: { steps: [], status: 'running' } })
    try {
      const existingItemId = crossRefFor(pkg.id)?.itemId
      const completed = await PackageInstaller.runImport({
        package: pkg,
        context: props.context,
        featureFlagProvisioning: props.featureFlagProvisioning,
        existingItemId,
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
      // the cancelled state; don't report success.
      if (!completed) return
      await refreshCrossRef()
      setState({
        notification: {
          intent: 'success',
          text:
            pkg.type === 'extension'
              ? strings.CatalogInstallSuccessTextExtension
              : strings.CatalogInstallSuccessText
        }
      })
    } catch (error) {
      setState({
        notification: { intent: 'error', text: error?.message || strings.CatalogInstallErrorTitle }
      })
    }
  }

  const publishCentral = async (pkg: ICatalogPackage): Promise<void> => {
    setState({ notification: undefined, busyAction: 'publish' })
    try {
      // A skymal's content types are real hub dependencies: provision them (and
      // their Prosjekter/Prosjektstatus bindings) to the hub now, in this admin
      // context, so projects later created from the skymal are recognized by the
      // portfolio. The rest (template, extensions, list content) is still pulled
      // from the .pppkg at project-setup time.
      await PackageInstaller.provisionSkymalHubDependencies(pkg, props.context)
      await TemplateOptionsService.createCentral(pkg)
      await refreshCrossRef()
      setState({ notification: { intent: 'success', text: strings.CatalogPublishSuccessText } })
    } catch (error) {
      setState({
        notification: { intent: 'error', text: error?.message || strings.CatalogPublishErrorText }
      })
    } finally {
      setState({ busyAction: undefined })
    }
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
      await TemplateOptionsService.remove(ref.itemId)
      await refreshCrossRef()
      setState({ notification: { intent: 'success', text: strings.CatalogRemoveSuccessText } })
    } catch (error) {
      setState({
        notification: { intent: 'error', text: error?.message || strings.CatalogRemoveErrorText }
      })
    } finally {
      setState({ busyAction: undefined })
    }
  }

  return {
    props,
    state: { ...state, page },
    setState,
    filteredPackages,
    pagedPackages,
    pageCount,
    categories,
    languages,
    activeFilterCount,
    hasActiveFilters,
    selectedPackage,
    crossRefFor,
    isSupported,
    setFilter,
    setCompatibleOnly,
    clearFilters,
    reloadCatalog,
    setSort,
    setRenderMode,
    setSelected,
    setPage,
    closeDetail,
    importPackage,
    publishCentral,
    removePackage,
    resolveCompatibility
  }
}
