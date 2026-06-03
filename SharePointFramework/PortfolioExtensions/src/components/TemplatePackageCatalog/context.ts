import { createContext, useContext } from 'react'
import { ITemplatePackageCatalogContext } from './types'

export const TemplatePackageCatalogContext =
  createContext<ITemplatePackageCatalogContext>(null)

/**
 * Convenience hook for consuming the catalog context.
 */
export function useCatalogContext(): ITemplatePackageCatalogContext {
  return useContext(TemplatePackageCatalogContext)
}
