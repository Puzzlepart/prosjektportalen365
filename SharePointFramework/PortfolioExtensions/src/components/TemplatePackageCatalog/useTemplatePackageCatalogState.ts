import { useState } from 'react'
import { ALL_FILTER, ITemplatePackageCatalogState } from './types'

/**
 * State hook for the catalog. `setState` shallow-merges into the current
 * state and supports the updater-function form for async flows. Mirrors the
 * `useProjectProvisionState` pattern.
 */
export function useTemplatePackageCatalogState() {
  const [state, $setState] = useState<ITemplatePackageCatalogState>({
    loading: true,
    degraded: false,
    crossRef: new Map(),
    filters: {
      search: '',
      type: 'template',
      categories: [],
      status: 'all',
      language: ALL_FILTER,
      compatibleOnly: false
    },
    sort: 'name',
    renderMode: 'grid',
    detailOpen: false
  })

  const setState = (
    newState:
      | Partial<ITemplatePackageCatalogState>
      | ((current: ITemplatePackageCatalogState) => Partial<ITemplatePackageCatalogState>)
  ) =>
    $setState((current) => ({
      ...current,
      ...(typeof newState === 'function' ? newState(current) : newState)
    }))

  return { state, setState } as const
}
