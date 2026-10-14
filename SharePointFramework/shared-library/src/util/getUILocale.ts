import { pageContextInfo } from './pageContext'

/**
 * SharePoint's UI language as a BCP 47 tag (`nb-NO`, `en-US`), for formatting dates and numbers.
 *
 * SPFx loads the solutions' strings for this culture (`pageContext.cultureInfo.currentUICultureName`),
 * so dates and numbers formatted in it match the text beside them. Formatting with no locale
 * follows the browser's language instead: an English browser on a Norwegian site read
 * "11/18/2022" among Norwegian labels. Read from the page context the library was given
 * (`pageContextInfo`: what SPFx handed over when a client was created, else `_spPageContextInfo`,
 * which classic pages set on `window` and modern pages do not), then `<html lang>` (SharePoint
 * sets it on modern pages), then `nb-NO`, PP365's default language. So it needs no SPFx context
 * of its own.
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
