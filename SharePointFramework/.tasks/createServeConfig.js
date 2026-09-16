/**
 * Generates `config/serve.json` for the current solution.
 *
 * Under the Heft toolchain `heft start` opens `serveConfigurations.<name>.pageUrl` and appends the
 * debug query string itself (`debug`, `noredir`, `debugManifestsFile`, plus `loadSPFX`/`customActions`
 * for extensions). The hosted workbench is retired on 2026-12-01, so every environment points at a
 * real page instead.
 *
 * Sources, in order of precedence:
 *   1. `environments.json` in the solution root (gitignored, per developer) - one serve configuration
 *      per environment, named after `name` (or `env<index>` when unnamed).
 *   2. `config/serve.sample.json` - the committed base: port, https and any hand-written
 *      serve configurations, which are kept unless an environment of the same name overrides them.
 *
 * The `default` configuration is required by Heft whenever `serveConfigurations` is present. It is
 * taken from `SERVE_ENVIRONMENT` when that names an environment, otherwise from the first environment,
 * otherwise from whatever the sample already defined.
 *
 * Select a configuration at run time with:  npm run watch -- --serve-config <name>
 */
const fs = require('fs')
const path = require('path')
const colors = require('colors/safe')
const { log } = require('./util')
require('dotenv').config()

const SERVE_SCHEMA = 'https://developer.microsoft.com/json-schemas/spfx-build/spfx-serve.schema.json'
const EXTENSION_LOCATIONS = {
  ListViewCommandSet: 'ClientSideExtension.ListViewCommandSet.CommandBar',
  ApplicationCustomizer: 'ClientSideExtension.ApplicationCustomizer'
}

const solutionRoot = process.cwd()
const sampleFile = path.join(solutionRoot, 'config/serve.sample.json')
const serveFile = path.join(solutionRoot, 'config/serve.json')
const environmentsFile = path.join(solutionRoot, 'environments.json')

const readJson = (file) => JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }))

/**
 * Resolves the `{tenantDomain}` token that the SPFx serve plugin understands.
 *
 * Heft substitutes it from the `SPFX_SERVE_TENANT_DOMAIN` environment variable at serve time, but
 * `heft start` is launched directly by the npm script and never loads the solution's `.env` - only
 * these pre-watch tasks do. Substituting here means the documented `.env` workflow actually works.
 * When the variable is unset the token is left intact, so Heft can still resolve it from a real
 * environment variable.
 */
function resolveTenantDomain(value) {
  const domain = process.env.SPFX_SERVE_TENANT_DOMAIN
  if (!domain) return value
  return JSON.parse(JSON.stringify(value).split('{tenantDomain}').join(domain))
}

/** Joins a site URL and a server-relative page path, then appends any extra query parameters. */
function buildPageUrl({ siteUrl, page, queryParameters }) {
  const url = new URL(`${String(siteUrl).replace(/\/+$/, '')}/${String(page).replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(queryParameters || {})) {
    url.searchParams.set(key, String(value))
  }
  return url.href
}

/** Maps one `environments.json` entry onto a Heft serve configuration. */
function toServeConfiguration(environment) {
  const configuration = { pageUrl: buildPageUrl(environment) }
  const { componentType, componentId, componentProperties = {}, fieldName } = environment
  if (!componentId) return configuration
  if (componentType === 'FieldCustomizer' && fieldName) {
    configuration.fieldCustomizers = { [fieldName]: { id: componentId, properties: componentProperties } }
  } else if (EXTENSION_LOCATIONS[componentType]) {
    configuration.customActions = {
      [componentId]: { location: EXTENSION_LOCATIONS[componentType], properties: componentProperties }
    }
  }
  return configuration
}

function createServeConfig() {
  const hasSample = fs.existsSync(sampleFile)
  const hasEnvironments = fs.existsSync(environmentsFile)

  // Without environments.json, keep the historical behaviour: seed serve.json from the sample once
  // and leave the developer's own edits alone.
  if (!hasEnvironments) {
    if (hasSample && !fs.existsSync(serveFile)) {
      const sample = resolveTenantDomain(readJson(sampleFile))
      fs.writeFileSync(serveFile, JSON.stringify(sample, null, 2) + '\n', { encoding: 'utf8' })
      log(
        `${colors.magenta('config/serve.json')} was generated from ${colors.magenta('config/serve.sample.json')}`,
        'createServeConfig'
      )
    }
    return
  }

  const base = hasSample ? readJson(sampleFile) : {}
  const { environments = [] } = readJson(environmentsFile)
  const serveConfigurations = { ...(base.serveConfigurations || {}) }

  environments.forEach((environment, index) => {
    const name = environment.name || `env${index + 1}`
    serveConfigurations[name] = toServeConfiguration(environment)
  })

  // Heft requires a "default" entry whenever serveConfigurations is present.
  const selected = process.env.SERVE_ENVIRONMENT
  if (selected && serveConfigurations[selected]) {
    serveConfigurations.default = serveConfigurations[selected]
  } else if (!serveConfigurations.default) {
    const [firstEnvironment] = environments
    if (firstEnvironment) serveConfigurations.default = toServeConfiguration(firstEnvironment)
  }
  if (selected && !serveConfigurations[selected]) {
    log(
      `Environment ${colors.red(selected)} from SERVE_ENVIRONMENT is not defined in environments.json`,
      'createServeConfig'
    )
  }

  const serveConfig = resolveTenantDomain({
    port: 4321,
    https: true,
    ...base,
    $schema: SERVE_SCHEMA,
    serveConfigurations
  })
  // initialPage is only a fallback for projects without serveConfigurations, and it still points at
  // the retiring hosted workbench in the committed samples.
  delete serveConfig.initialPage

  fs.writeFileSync(serveFile, JSON.stringify(serveConfig, null, 2) + '\n', { encoding: 'utf8' })
  const names = Object.keys(serveConfigurations).filter((name) => name !== 'default')
  log(
    `${colors.magenta('config/serve.json')} generated with ${colors.cyan(names.length)} configuration(s): ${names
      .map((name) => colors.cyan(name))
      .join(', ')}${selected ? ` (default: ${colors.magenta(selected)})` : ''}`,
    'createServeConfig'
  )
}

try {
  createServeConfig()
} catch (err) {
  log(colors.red(`Failed to generate config/serve.json: ${err.message}`), 'createServeConfig')
}
