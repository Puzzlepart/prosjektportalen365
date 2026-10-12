import type { SPFxContext } from 'pp365-shared-library/lib/types/index.js'

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
 * the page context's web, site, user, legacy page context and culture, built from what the site
 * says about itself. Nothing else is there. The strings must be in the site's language: the
 * services find the hub's lists by their titles in it (`Lists_ProjectColumns_Title`).
 *
 * @param site The site collection
 * @param web The web
 * @param user The user
 * @param locale The page's language, as SPFx names its string bundles (`nb-no`)
 */
export function spfxContext(
  site: ISiteInfo,
  web: IWebInfo,
  user: IUserInfo,
  locale: string
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
      legacyPageContext: { hubSiteId: site.HubSiteId, webAbsoluteUrl: web.Url },
      cultureInfo: { currentCultureName: culture, currentUICultureName: culture }
    }
  } as unknown as SPFxContext
}
