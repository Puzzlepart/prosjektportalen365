/**
 * The page context SharePoint sets on every page (`_spPageContextInfo`), where there is one.
 * `globalThis` is the page's `window`; outside a page (the integration tests in Node) the
 * context may be set on it, and nothing else of a page is there.
 */
const pageContextInfo = (): { currentCultureName?: string; currentUICultureName?: string } =>
  (globalThis as any)._spPageContextInfo ?? {}

/**
 * SharePoint's UI language as a BCP 47 tag (`nb-NO`, `en-US`), for formatting dates and numbers.
 *
 * SPFx loads the solutions' strings for this culture (`pageContext.cultureInfo.currentUICultureName`),
 * so dates and numbers formatted in it match the text beside them. Formatting with no locale
 * follows the browser's language instead: an English browser on a Norwegian site read
 * "11/18/2022" among Norwegian labels. Read from the page, so it needs no SPFx context:
 * `_spPageContextInfo` first, then `<html lang>` (SharePoint sets it on modern pages), then
 * `nb-NO`, PP365's default language.
 */
export function getUILocale(): string {
  return (
    pageContextInfo().currentUICultureName ||
    (typeof document === 'undefined' ? '' : document.documentElement.lang) ||
    'nb-NO'
  )
}

/**
 * SharePoint's regional format as a BCP 47 tag: the culture it writes field values as text in
 * (`FieldValuesAsText`), from the site's regional settings. It can differ from the UI language
 * (an English UI on a site with Norwegian regional settings), and only it says whether
 * "03/04/2026" is 3 April or 4 March. The page context's `currentCultureName`, else the UI
 * language.
 */
export function getRegionalLocale(): string {
  return pageContextInfo().currentCultureName || getUILocale()
}
