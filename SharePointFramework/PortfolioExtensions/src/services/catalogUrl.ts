/**
 * Default location of the central catalog (hosting repo, `main` branch). Can
 * be overridden by the `catalogUrl` command-set property.
 */
export const DEFAULT_CATALOG_URL =
  'https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/catalog.json'

/**
 * The catalog URL in effect: the command set's `catalogUrl` without surrounding whitespace, or
 * {@link DEFAULT_CATALOG_URL} when it is empty. The catalog is loaded from it, and catalog events
 * are sent only when it is the default (a customer's own catalog names its packages itself).
 *
 * @param catalogUrl The command-set property `catalogUrl`
 */
export function resolveCatalogUrl(catalogUrl?: string): string {
  return (catalogUrl && catalogUrl.trim()) || DEFAULT_CATALOG_URL
}
