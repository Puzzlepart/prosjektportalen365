/**
 * A Windows `SYSTEMTIME` rule for a time zone transition, as SharePoint's page context carries
 * it: `Month` 1 to 12 (0 when the zone has no daylight time), `DayOfWeek` 0 Sunday to 6 Saturday,
 * `Day` the occurrence of that weekday in the month (1 to 4, 5 the last), `Hour` and `Minute` in
 * the local time in force before the transition.
 */
export interface ISystemTime {
  Year: number
  Month: number
  DayOfWeek: number
  Day: number
  Hour: number
  Minute: number
  Second?: number
  Milliseconds?: number
}

/**
 * A site's time zone as SharePoint's page context carries it (`webTimeZoneData`, the shape of
 * `RegionalSettings/TimeZone` with the transition rules): `Bias` is the minutes west of UTC
 * (Oslo -60), `DaylightBias` what is added to it in daylight time (-60), the dates the rules.
 */
export interface ISiteTimeZone {
  Id?: number
  Description?: string
  Bias: number
  DaylightBias: number
  StandardBias?: number
  DaylightDate?: ISystemTime
  StandardDate?: ISystemTime
}

/** What the library reads from the page: the cultures and the site's time zone. */
export interface IPageContextInfo {
  currentUICultureName?: string
  currentCultureName?: string
  webTimeZoneData?: ISiteTimeZone
}

let remembered: IPageContextInfo | undefined

/**
 * Keeps the page context the library reads its UI language, regional format and site time zone
 * from. Called with SPFx's page context when a client is created (`createSpfiInstance`), so every
 * web part and extension feeds it before it renders; `undefined` forgets it (tests).
 *
 * Modern pages do not expose `_spPageContextInfo` on `window` (checked on the test hub on
 * 2026-10-13), only SPFx holds the page context there, so the library cannot read it from a global.
 */
export function setPageContextInfo(info?: IPageContextInfo): void {
  remembered = info
}

/**
 * Remembers the cultures and the site's time zone from an SPFx context: the culture info, and the
 * legacy page context's `webTimeZoneData`, which SPFx carries for every page.
 *
 * @param spfxContext An SPFx context (web part, extension), or anything shaped like one
 */
export function rememberPageContext(spfxContext: {
  pageContext?: {
    cultureInfo?: { currentUICultureName?: string; currentCultureName?: string }
    legacyPageContext?: { webTimeZoneData?: ISiteTimeZone }
  }
}): void {
  const pageContext = spfxContext?.pageContext
  if (!pageContext) return
  setPageContextInfo({
    currentUICultureName: pageContext.cultureInfo?.currentUICultureName,
    currentCultureName: pageContext.cultureInfo?.currentCultureName,
    webTimeZoneData: pageContext.legacyPageContext?.webTimeZoneData
  })
}

/**
 * The page context: what SPFx gave (`rememberPageContext`), else `_spPageContextInfo` where a
 * page or the integration harness sets it on `globalThis`, else nothing.
 */
export function pageContextInfo(): IPageContextInfo {
  return remembered ?? (globalThis as any)._spPageContextInfo ?? {}
}
