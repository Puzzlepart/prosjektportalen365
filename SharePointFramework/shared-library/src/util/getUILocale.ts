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
    (window as any)._spPageContextInfo?.currentUICultureName ||
    document.documentElement.lang ||
    'nb-NO'
  )
}
