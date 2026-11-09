import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The project's folder, `integration/`.
 */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

config({ path: resolve(ROOT, '.env'), quiet: true })

/**
 * A variable's value, or `undefined` when it is empty or still the `<placeholder>` of
 * `.env.example`.
 *
 * @param name Variable
 */
function configured(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value && !/<[^>]+>/.test(value) ? value : undefined
}

/**
 * How the tests sign in: as the CI app with its certificate (app-only), or as the e2e user with the
 * cookies the browser suite's sign-in left.
 */
export type AuthMode = 'certificate' | 'cookies'

/**
 * The CI app's sign-in: the tenant, the app's client id and its certificate (a PFX, base64, with no
 * password), as `Install/Scripts/SharedFunctions.ps1` signs in with them.
 */
export interface ICertificateSignIn {
  tenant: string
  clientId: string
  pfxBase64: string
}

/**
 * The configuration, from the environment and `integration/.env`.
 */
export const env = {
  hubUrl: configured('INTEGRATION_HUB_URL'),
  programUrl: configured('INTEGRATION_PROGRAM_URL'),
  projectUrl: configured('INTEGRATION_PROJECT_URL'),
  /** A second hub the program administration and the merged view read from, read only. */
  secondHubUrl: configured('INTEGRATION_SECOND_HUB_URL'),
  /** The language of the string bundles the library loads, as SPFx names them (`nb-no`). */
  locale: (configured('INTEGRATION_LOCALE') ?? 'nb-no').toLowerCase(),
  /** The user an app-only run acts for where the library asks for one. */
  user: configured('INTEGRATION_USER'),
  certificate: ((): ICertificateSignIn | undefined => {
    const tenant = configured('CI_TENANT')
    const clientId = configured('CI_CLIENT_ID')
    const pfxBase64 = configured('CI_CERT_BASE64')
    return tenant && clientId && pfxBase64 ? { tenant, clientId, pfxBase64 } : undefined
  })(),
  /**
   * Whether the run's upgrade applied the templates: CI's full upgrade does, the packages-only one
   * (`[apps-only]`) does not. The tests of the templates' state run only then.
   */
  templatesApplied: configured('INTEGRATION_TEMPLATES_APPLIED') === 'true',
  /** The commit under test, in CI (`GITHUB_SHA`), whose upgrade the installation log names. */
  commit: configured('GITHUB_SHA'),
  cookiesFile: resolve(
    ROOT,
    configured('INTEGRATION_COOKIES_FILE') ?? resolve(ROOT, '..', 'e2e', '.auth', 'user.json')
  )
}

/**
 * The sign-in to use: the one `INTEGRATION_AUTH` names, else the certificate when it is configured,
 * else the e2e user's cookies when their file exists; `undefined` when neither is there.
 */
export function authMode(): AuthMode | undefined {
  const forced = configured('INTEGRATION_AUTH')
  if (forced === 'certificate' || forced === 'cookies') return forced
  if (env.certificate) return 'certificate'
  if (existsSync(env.cookiesFile)) return 'cookies'
  return undefined
}

/**
 * Why a test cannot run here, or `undefined` when it can: no sign-in, or a site it needs is not
 * configured. For `describe(name, { skip: skipReason('hubUrl') }, ...)`. With
 * `INTEGRATION_STRICT=true` (CI) the reason is thrown instead, failing the test: there the
 * configuration is part of what runs, and a suite skipped whole would pass having tested nothing.
 *
 * @param sites The sites the test needs
 */
export function skipReason(
  ...sites: Array<'hubUrl' | 'programUrl' | 'projectUrl' | 'secondHubUrl'>
): string | undefined {
  const variables = {
    hubUrl: 'INTEGRATION_HUB_URL',
    programUrl: 'INTEGRATION_PROGRAM_URL',
    projectUrl: 'INTEGRATION_PROJECT_URL',
    secondHubUrl: 'INTEGRATION_SECOND_HUB_URL'
  }
  const missing = sites.filter((site) => !env[site]).map((site) => variables[site])
  const reason = !authMode()
    ? 'no sign-in configured: set CI_TENANT, CI_CLIENT_ID and CI_CERT_BASE64, or sign the e2e ' +
      'user in with `npx playwright test --project=setup` in e2e/'
    : missing.length
      ? `${missing.join(' and ')} not set`
      : undefined
  if (reason && configured('INTEGRATION_STRICT') === 'true') {
    throw new Error(`INTEGRATION_STRICT is set and ${reason}`)
  }
  return reason
}
