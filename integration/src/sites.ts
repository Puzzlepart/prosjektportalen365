import type { SPFI } from '@pnp/sp'
import { spfi } from '@pnp/sp'
import '@pnp/sp/presets/all.js'
import type { SPFxContext } from 'pp365-shared-library/lib/types/index.js'
import { signedIn } from './auth.ts'
import type { IUserInfo } from './context.ts'
import { spfxContext } from './context.ts'
import type { AuthMode } from './env.ts'
import { authMode, env } from './env.ts'
import { createSpfiInstance } from './library.ts'

/**
 * A site the tests talk to: a client signed in to it, and the SPFx context a web part on it would
 * have, which the library's services take.
 */
export interface ISite {
  url: string
  sp: SPFI
  context: SPFxContext
  mode: AuthMode
}

let factoryRegistered = false

/**
 * The library's clients connect the way the tests sign in, to the web of the context they are given
 * (`setSpfiFactory`), as on a page they connect through SPFx to the page's web. Registered once.
 *
 * @param mode Sign-in mode
 */
function registerFactory(mode: AuthMode): void {
  if (factoryRegistered) return
  createSpfiInstance().setSpfiFactory((context: SPFxContext) =>
    signedIn(mode, context.pageContext.web.absoluteUrl)
  )
  factoryRegistered = true
}

/**
 * Connects to a site: a signed-in client, and an SPFx context built from what the site says about
 * itself, so a service configured with it reads and writes where a web part on the site would. The
 * user is the signed-in one, or, app-only, `INTEGRATION_USER`.
 *
 * @param url The site
 */
export async function connect(url: string): Promise<ISite> {
  const mode = authMode()
  if (!mode) throw new Error('No sign-in configured (see integration/.env.example)')
  registerFactory(mode)
  const siteUrl = url.replace(/\/+$/, '')
  const sp = spfi(siteUrl).using(signedIn(mode, siteUrl))
  const [site, web] = await Promise.all([
    sp.site.select('Id', 'Url', 'ServerRelativeUrl', 'HubSiteId')(),
    sp.web.select('Id', 'Title', 'Url', 'ServerRelativeUrl', 'Language')()
  ])
  const user: IUserInfo =
    mode === 'cookies'
      ? await sp.web.currentUser.select('Title', 'Email', 'LoginName')()
      : {
          Title: env.user ?? '',
          Email: env.user ?? '',
          LoginName: env.user ? `i:0#.f|membership|${env.user}` : ''
        }
  return { url: siteUrl, sp, context: spfxContext(site, web, user, env.locale), mode }
}
