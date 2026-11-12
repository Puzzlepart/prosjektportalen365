import { UrlQueryParameterCollection } from '@microsoft/sp-core-library'

/**
 * Reads a named query parameter from the current page URL.
 */
export function getUrlParam(key: string): string {
  return new UrlQueryParameterCollection(document.location.href).getValue(key)
}
