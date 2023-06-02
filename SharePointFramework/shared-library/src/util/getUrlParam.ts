import { UrlQueryParameterCollection } from '@microsoft/sp-core-library'

/**
 * Get url param
 *
 * @param key Key
 */
export function getUrlParam(key: string): string {
  return new UrlQueryParameterCollection(document.location.href).getValue(key)
}
