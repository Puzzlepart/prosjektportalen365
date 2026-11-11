import { ConfidentialClientApplication } from '@azure/msal-node'
import type { TimelinePipe } from '@pnp/core'
import { combine, isUrlAbsolute } from '@pnp/core'
import type { Queryable } from '@pnp/queryable'
import { BrowserFetchWithRetry, DefaultParse } from '@pnp/queryable'
import { DefaultHeaders, DefaultInit, RequestDigest } from '@pnp/sp'
import forge from 'node-forge'
import { readFileSync } from 'node:fs'
import type { AuthMode, ICertificateSignIn } from './env.ts'
import { env } from './env.ts'

/**
 * How a PnPjs client talks to SharePoint from Node, in either sign-in mode. Nothing here writes a
 * token, a cookie or the certificate anywhere.
 */

/**
 * Relative URLs (`_api/web`, as the library's clients ask with `spfi()`) against the site, as SPFx
 * resolves them against the page's web.
 *
 * @param baseUrl The site
 */
function resolveAgainst(baseUrl: string): TimelinePipe<Queryable> {
  return (instance) => {
    instance.on.pre.prepend(async (url, init, result) => [
      isUrlAbsolute(url) ? url : combine(baseUrl, url),
      init,
      result
    ])
    return instance
  }
}

/**
 * A PFX opened without a password. One exported with an empty password derives its keys from a
 * terminating null, one exported with none (`null`) from no bytes at all; .NET and OpenSSL open
 * both, node-forge only the one it is told, so both are tried. The errors name the variable, never
 * its value.
 *
 * @param pfxBase64 The PFX, base64
 */
function openPfx(pfxBase64: string): forge.pkcs12.Pkcs12Pfx {
  let asn1: forge.asn1.Asn1
  try {
    asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64))
  } catch {
    throw new Error('CI_CERT_BASE64 is not a PFX in base64')
  }
  try {
    return forge.pkcs12.pkcs12FromAsn1(asn1, '')
  } catch {
    try {
      return forge.pkcs12.pkcs12FromAsn1(asn1, true, null as unknown as string)
    } catch (error) {
      throw new Error(
        `CI_CERT_BASE64 does not open without a password: ${(error as Error).message}`
      )
    }
  }
}

/**
 * The private key and SHA-256 thumbprint of the app's certificate, read from the PFX in memory.
 *
 * @param pfxBase64 The PFX, base64, without a password
 */
export function readCertificate(pfxBase64: string): {
  privateKey: string
  thumbprintSha256: string
} {
  const pfx = openPfx(pfxBase64)
  const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
    forge.pki.oids.pkcs8ShroudedKeyBag
  ]
  const plainKeyBags = pfx.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]
  const key = keyBags?.[0]?.key ?? plainKeyBags?.[0]?.key
  const certificate = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0]
    ?.cert
  if (!key || !certificate) throw new Error('CI_CERT_BASE64 holds no private key and certificate')
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes()
  return {
    privateKey: forge.pki.privateKeyToPem(key),
    thumbprintSha256: forge.md.sha256.create().update(der).digest().toHex()
  }
}

/** One MSAL client per run: it keeps the token and renews it, whichever PnPjs client asks. */
let appClient: ConfidentialClientApplication | undefined

/**
 * A token for SharePoint, as the CI app (app-only).
 *
 * @param signIn The app's sign-in
 * @param origin The tenant's SharePoint origin (`https://<tenant>.sharepoint.com`)
 */
async function appToken(signIn: ICertificateSignIn, origin: string): Promise<string> {
  appClient ??= new ConfidentialClientApplication({
    auth: {
      clientId: signIn.clientId,
      authority: `https://login.microsoftonline.com/${signIn.tenant}`,
      clientCertificate: readCertificate(signIn.pfxBase64)
    }
  })
  const result = await appClient.acquireTokenByClientCredential({ scopes: [`${origin}/.default`] })
  if (!result?.accessToken) throw new Error(`No token for ${origin} from tenant ${signIn.tenant}`)
  return result.accessToken
}

/**
 * Signed in as the CI app: a bearer token on every request. SharePoint needs no request digest
 * with one.
 *
 * @param baseUrl The site relative URLs resolve against
 */
function certificateBehavior(baseUrl: string): TimelinePipe<Queryable> {
  const signIn = env.certificate
  if (!signIn)
    throw new Error('Certificate sign-in needs CI_TENANT, CI_CLIENT_ID and CI_CERT_BASE64')
  const { origin } = new URL(baseUrl)
  return (instance) => {
    instance.using(DefaultHeaders(), DefaultInit(), BrowserFetchWithRetry(), DefaultParse())
    instance.on.auth.replace(async (url, init) => {
      init.headers = { ...init.headers, Authorization: `Bearer ${await appToken(signIn, origin)}` }
      return [url, init]
    })
    return resolveAgainst(baseUrl)(instance)
  }
}

/**
 * The e2e user's session cookies for a host, from the browser suite's sign-in
 * (`e2e/.auth/user.json`, Playwright's storage state).
 *
 * @param host The SharePoint host
 */
function sessionCookies(host: string): string {
  const { cookies } = JSON.parse(readFileSync(env.cookiesFile, 'utf8')) as {
    cookies: Array<{ name: string; value: string; domain: string; expires: number }>
  }
  const forHost = cookies.filter(({ domain }) => {
    const bare = domain.replace(/^\./, '')
    return host === bare || host.endsWith(`.${bare}`)
  })
  const session = forHost.find(({ name }) => name === 'FedAuth')
  if (!session || (session.expires > 0 && session.expires * 1000 < Date.now())) {
    throw new Error(
      `The e2e user's session for ${host} is missing or has expired in ${env.cookiesFile}: ` +
        'sign in again with `npx playwright test --project=setup` in e2e/'
    )
  }
  return forHost.map(({ name, value }) => `${name}=${value}`).join('; ')
}

/**
 * SharePoint's v2.1 APIs (the term store's) refuse cookie calls that do not come from a browser:
 * "OAuth only flow is enabled and the call has not been issued from an app". The session is the
 * browser's own, so the calls say they come from one.
 */
const BROWSER_AGENT = 'Mozilla/5.0 (compatible; pp365-integration)'

/**
 * Signed in as the e2e user, with the session the browser suite's sign-in left; writes carry a
 * request digest, as on a page.
 *
 * @param baseUrl The site relative URLs resolve against
 */
function cookieBehavior(baseUrl: string): TimelinePipe<Queryable> {
  const cookie = sessionCookies(new URL(baseUrl).hostname)
  return (instance) => {
    instance.using(
      DefaultHeaders(),
      DefaultInit(),
      BrowserFetchWithRetry(),
      DefaultParse(),
      RequestDigest()
    )
    instance.on.auth.replace(async (url, init) => {
      init.headers = { ...init.headers, Cookie: cookie, 'User-Agent': BROWSER_AGENT }
      return [url, init]
    })
    return resolveAgainst(baseUrl)(instance)
  }
}

/**
 * The behaviour that connects a PnPjs client to SharePoint in a sign-in mode.
 *
 * @param mode Sign-in mode
 * @param baseUrl The site relative URLs resolve against
 */
export function signedIn(mode: AuthMode, baseUrl: string): TimelinePipe<Queryable> {
  return mode === 'certificate' ? certificateBehavior(baseUrl) : cookieBehavior(baseUrl)
}
