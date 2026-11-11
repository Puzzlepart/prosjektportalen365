import type { SPFxContext } from 'pp365-shared-library/lib/types/index.js'
import type { ISiteTimeZone } from 'pp365-shared-library/lib/util/pageContext.js'

/** What `/_api/web/RegionalSettings/TimeZone` says about a web's time zone: offsets, no rules. */
export interface ITimeZoneInfo {
  Description: string
  Id: number
  Information: { Bias: number; DaylightBias: number; StandardBias: number }
}

/**
 * SharePoint's time zones that change on the European Union's days, by their ids in
 * `RegionalSettings/TimeZones`: London (2); Amsterdam, Berlin, Stockholm (3); Brussels,
 * Copenhagen, Paris (4, the test hub's); Belgrade, Prague (5); Sarajevo, Warsaw (6); Athens,
 * Bucharest (7); Helsinki, Riga, Tallinn (59).
 */
const EU_RULE_IDS = new Set([2, 3, 4, 5, 6, 7, 59])

/**
 * The web's time zone as a page's context carries it (`legacyPageContext.webTimeZoneData`, which
 * the library formats dates by). The REST API gives the offsets but not the transition rules, which
 * the page context has from Windows. The European Union's rule is known here: the last Sunday of
 * March and of October at 01:00 UTC, written in the local time then in force, as Windows writes
 * it. A zone without daylight time needs no rule. Another zone's rules the harness does not know,
 * and the context then carries no time zone: the library formats in the machine's zone, as on a
 * page that gave none, and the test of the site's day skips.
 *
 * @param timeZone The web's time zone, from the REST API
 */
export function siteTimeZoneData(timeZone: ITimeZoneInfo | undefined): ISiteTimeZone | undefined {
  if (!timeZone) return undefined
  const { Bias, DaylightBias, StandardBias } = timeZone.Information
  const zone: ISiteTimeZone = {
    Id: timeZone.Id,
    Description: timeZone.Description,
    Bias,
    DaylightBias,
    StandardBias
  }
  if (DaylightBias === 0) return zone
  if (!EU_RULE_IDS.has(timeZone.Id)) return undefined
  const standardHours = -(Bias + StandardBias) / 60
  const daylightHours = -(Bias + DaylightBias) / 60
  return {
    ...zone,
    DaylightDate: { Year: 0, Month: 3, DayOfWeek: 0, Day: 5, Hour: 1 + standardHours, Minute: 0 },
    StandardDate: { Year: 0, Month: 10, DayOfWeek: 0, Day: 5, Hour: 1 + daylightHours, Minute: 0 }
  }
}

/** What `/_api/site` says about a site collection, as far as the context needs it. */
export interface ISiteInfo {
  Id: string
  Url: string
  ServerRelativeUrl: string
  HubSiteId: string
}

/** What `/_api/web` says about a web, as far as the context needs it. */
export interface IWebInfo {
  Id: string
  Title: string
  Url: string
  ServerRelativeUrl: string
  Language: number
}

/** The user a web part on the site would run as. */
export interface IUserInfo {
  Title: string
  Email: string
  LoginName: string
}

/** A value SPFx gives as a `Guid`: its string is all the library reads. */
const guid = (id: string) => ({ toString: () => id })

/** The languages the library has strings for, as SharePoint numbers a web's (`Language`). */
const LANGUAGES: Record<string, number> = { 'nb-no': 1044, 'en-us': 1033 }

/**
 * The SPFx context a web part on the site would have, as far as the library's services read it:
 * the page context's web, site, user, legacy page context (with the site's time zone, where the
 * harness knows its rules) and culture, built from what the site says about itself. Nothing else
 * is there. The strings must be in the site's language: the services find the hub's lists by their
 * titles in it (`Lists_ProjectColumns_Title`).
 *
 * @param site The site collection
 * @param web The web
 * @param user The user
 * @param locale The page's language, as SPFx names its string bundles (`nb-no`)
 * @param timeZone The web's time zone, from the REST API
 */
export function spfxContext(
  site: ISiteInfo,
  web: IWebInfo,
  user: IUserInfo,
  locale: string,
  timeZone?: ITimeZoneInfo
): SPFxContext {
  if (LANGUAGES[locale] !== web.Language) {
    throw new Error(
      `INTEGRATION_LOCALE ${locale} does not match the language of ${web.Url} (${web.Language}): ` +
        "the library finds the hub's lists by their titles in the strings' language"
    )
  }
  const culture = locale.replace(/-(\w+)$/, (_, region: string) => `-${region.toUpperCase()}`)
  return {
    pageContext: {
      web: {
        id: guid(web.Id),
        absoluteUrl: web.Url,
        serverRelativeUrl: web.ServerRelativeUrl,
        title: web.Title,
        language: web.Language
      },
      site: { id: guid(site.Id), absoluteUrl: site.Url, serverRelativeUrl: site.ServerRelativeUrl },
      user: { displayName: user.Title, email: user.Email, loginName: user.LoginName },
      legacyPageContext: {
        hubSiteId: site.HubSiteId,
        webAbsoluteUrl: web.Url,
        webTimeZoneData: siteTimeZoneData(timeZone)
      },
      cultureInfo: { currentCultureName: culture, currentUICultureName: culture }
    }
  } as unknown as SPFxContext
}
