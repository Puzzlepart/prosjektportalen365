import { useEffect, useMemo } from 'react'
import strings from 'PortfolioExtensionsStrings'
import { ICatalogPackage, ICrossReference } from 'models'
import { CatalogService, MaloppsettService, PackageInstaller } from 'services'
import {
  ALL_FILTER,
  ICatalogFilters,
  ITemplatePackageCatalogContext,
  ITemplatePackageCatalogProps,
  PAGE_SIZE,
  RenderMode,
  SortKey
} from './types'
import { useTemplatePackageCatalogState } from './useTemplatePackageCatalogState'

/**
 * Orchestrates the catalog: loads the catalog + Maloppsett cross-reference,
 * derives the filtered/sorted/paginated package list, and exposes the import /
 * publish-central / remove actions. Mirrors `useProvisionDrawer`.
 */
export function useTemplatePackageCatalog(
  props: ITemplatePackageCatalogProps
): ITemplatePackageCatalogContext {
  const { state, setState } = useTemplatePackageCatalogState()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { catalog, degraded, error } = await CatalogService.getCatalog(props.catalogUrl)
      let crossRef = new Map<string, ICrossReference>()
      try {
        const items = await MaloppsettService.getItems()
        crossRef = MaloppsettService.buildCrossReference(items, catalog)
      } catch {
        // Cross-reference is optional (fields may not be provisioned yet).
      }
      if (cancelled) return
      setState({ loading: false, catalog, degraded, error, crossRef })
    })()
    return () => {
      cancelled = true
    }
  }, [props.catalogUrl])

  const allPackages = state.catalog?.packages ?? []

  const categories = useMemo(() => {
    const set = new Set<string>()
    allPackages.forEach((pkg) => (pkg.tags ?? []).forEach((tag) => set.add(tag)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [allPackages])

  const crossRefFor = (packageId: string): ICrossReference | undefined =>
    state.crossRef.get(packageId.toLowerCase())

  const filteredPackages = useMemo(() => {
    const { search, type, category, status } = state.filters
    const term = search.trim().toLowerCase()
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
      if (term) {
        const haystack = [pkg.name, pkg.description, ...(pkg.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
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
  }, [allPackages, state.filters, state.sort, state.crossRef])

  const pageCount = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE))
  const page = Math.min(state.page, pageCount)
  const pagedPackages = filteredPackages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedPackage = allPackages.find((pkg) => pkg.id === state.selectedPackageId)

  const setFilter = (key: keyof ICatalogFilters, value: string) =>
    setState((current) => ({ filters: { ...current.filters, [key]: value }, page: 1 }))

  const clearFilters = () =>
    setState({
      // Keep Mal (template) as the default type when clearing filters.
      filters: { search: '', type: 'template', category: ALL_FILTER, status: 'all' },
      page: 1
    })

  const setSort = (sort: SortKey) => setState({ sort, page: 1 })
  const setRenderMode = (renderMode: RenderMode) => setState({ renderMode })
  const setSelected = (packageId: string) =>
    setState({ selectedPackageId: packageId, detailOpen: true, installProgress: undefined })
  const setPage = (newPage: number) => setState({ page: newPage })
  const closeDetail = () => setState({ detailOpen: false })

  const refreshCrossRef = async (): Promise<void> => {
    if (!state.catalog) return
    try {
      const items = await MaloppsettService.getItems()
      setState({ crossRef: MaloppsettService.buildCrossReference(items, state.catalog) })
    } catch {
      // ignore
    }
  }

  const importPackage = async (pkg: ICatalogPackage): Promise<void> => {
    setState({ notification: undefined, installProgress: { steps: [], status: 'running' } })
    try {
      const existingItemId = crossRefFor(pkg.id)?.itemId
      await PackageInstaller.runImport({
        package: pkg,
        context: props.context,
        featureFlagProvisioning: props.featureFlagProvisioning,
        existingItemId,
        onProgress: (installProgress) => setState({ installProgress })
      })
      await refreshCrossRef()
      setState({ notification: { intent: 'success', text: strings.CatalogInstallSuccessText } })
    } catch (error) {
      setState({
        notification: { intent: 'error', text: error?.message || strings.CatalogInstallErrorTitle }
      })
    }
  }

  const publishCentral = async (pkg: ICatalogPackage): Promise<void> => {
    setState({ notification: undefined })
    try {
      await MaloppsettService.createCentral(pkg)
      await refreshCrossRef()
      setState({ notification: { intent: 'success', text: strings.CatalogPublishSuccessText } })
    } catch (error) {
      setState({ notification: { intent: 'error', text: error?.message } })
    }
  }

  const removePackage = async (pkg: ICatalogPackage): Promise<void> => {
    const ref = crossRefFor(pkg.id)
    if (!ref) return
    try {
      await MaloppsettService.remove(ref.itemId)
      await refreshCrossRef()
      setState({ notification: { intent: 'success', text: strings.CatalogRemoveSuccessText } })
    } catch (error) {
      setState({ notification: { intent: 'error', text: error?.message } })
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
    selectedPackage,
    crossRefFor,
    setFilter,
    clearFilters,
    setSort,
    setRenderMode,
    setSelected,
    setPage,
    closeDetail,
    importPackage,
    publishCentral,
    removePackage
  }
}
