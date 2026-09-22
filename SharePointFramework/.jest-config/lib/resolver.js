/**
 * Jest resolver that understands SPFx localized string modules.
 *
 * SPFx code imports strings as bare module names (`import strings from 'SharedLibraryStrings'`).
 * At runtime the SPFx loader maps those names through `localizedResources` in config/config.json
 * to a per-locale AMD bundle. Jest knows nothing about that map, so this resolver reproduces it:
 * the map is read from the solution under test (`<rootDir>/config/config.json`), `{locale}` is
 * replaced with `nb-no` (the product's default language, and the one the loc triad is authored
 * in), and `lib/` is redirected to `lib-commonjs/`, where the rig copies the same files for Jest.
 * Bundles that live in another package (`node_modules/pp365-shared-library/lib/loc/...`) are
 * resolved from the solution's node_modules, so shared strings resolve too.
 *
 * Everything else is delegated to Jest's default resolver, after applying the same `__mocks__`
 * path rewrite that @rushstack/heft-jest-plugin's resolver performs.
 */
const fs = require('fs')
const path = require('path')

const LOCALE = process.env.PP365_TEST_LOCALE || 'nb-no'
const mockPathRegExp = /^(\..*[\/])__mocks__\/([^\/]+)$/
const localizedResourcesCache = new Map()

function readLocalizedResources(rootDir) {
  if (!localizedResourcesCache.has(rootDir)) {
    let resources = {}
    try {
      const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'config', 'config.json'), 'utf8'))
      resources = config.localizedResources || {}
    } catch {
      // A project without config/config.json (the rig is not SPFx) simply has no string modules.
    }
    localizedResourcesCache.set(rootDir, resources)
  }
  return localizedResourcesCache.get(rootDir)
}

function resolveLocalizedResource(request, rootDir) {
  const resources = readLocalizedResources(rootDir)
  const template = resources[request]
  if (!template) return undefined
  const relative = template.replace('{locale}', LOCALE).replace(/^lib\//, 'lib-commonjs/')
  const candidate = path.join(rootDir, relative)
  if (fs.existsSync(candidate)) return candidate
  // Packages that publish only lib/ (no lib-commonjs/) keep the original path.
  const fallback = path.join(rootDir, template.replace('{locale}', LOCALE))
  return fs.existsSync(fallback) ? fallback : undefined
}

module.exports = function resolve(request, options) {
  const localized = resolveLocalizedResource(request, options.rootDir)
  if (localized) return localized
  const match = mockPathRegExp.exec(request)
  const newRequest = match ? match[1] + match[2] : request
  return options.defaultResolver(newRequest, options)
}
