import { createContext, useContext } from 'react'
import { ITemplatePackageCatalogContext } from './types'

/** Shares catalog state and package actions throughout the drawer. */
export const TemplatePackageCatalogContext = createContext<ITemplatePackageCatalogContext>(null)

/**
 * Convenience hook for consuming the catalog context.
 */
export function useCatalogContext(): ITemplatePackageCatalogContext {
  return useContext(TemplatePackageCatalogContext)
}
