import { createRequire, registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { env } from './env.ts'

/**
 * Lets Node load the shared library's CommonJS build (`lib-commonjs`), as the Jest harness lets
 * Jest: the SPFx string modules (`SharedLibraryStrings`, `SharedResources`) resolve to the
 * library's AMD bundles in `INTEGRATION_LOCALE`, made CommonJS on load; `@microsoft/sp-*`, which
 * need Microsoft-internal modules and are the page's at runtime, resolve to the harness's
 * stand-in; and the stylesheets the UI half of a barrel pulls in resolve to class names. The stubs
 * and the AMD transform are the Jest harness's own (`pp365-jest-config/lib`), so both harnesses
 * read the bundles alike. Imported for its side effect, before the library's first module.
 */

const require = createRequire(import.meta.url)

/** The shared library's folder, through its workspace link. */
export const LIBRARY = dirname(require.resolve('pp365-shared-library/package.json'))

const JEST_CONFIG = dirname(require.resolve('pp365-jest-config/package.json'))

const amdTransform: { process: (source: string, path: string) => { code: string } } = require(
  join(JEST_CONFIG, 'lib', 'amdTransform.js')
)

/**
 * An SPFx string bundle (`define([], function () { return { ... } })`) as CommonJS. A bundle of
 * any other shape throws, naming the file, when the module runs.
 *
 * @param source The bundle's text
 * @param path Its path, for the error
 */
export function stringsToCommonJs(source: string, path: string): string {
  return amdTransform.process(source, path).code
}

/**
 * The string modules the library names in `config/config.json`, as files of its CommonJS build in
 * the configured language: SPFx maps `lib/loc/{locale}.js`, the CommonJS build has the same bundles
 * under `lib-commonjs`.
 */
const STRING_MODULES = new Map<string, string>(
  Object.entries(
    JSON.parse(readFileSync(join(LIBRARY, 'config', 'config.json'), 'utf8'))
      .localizedResources as Record<string, string>
  )
    .filter(([, template]) => template.startsWith('lib/'))
    .map(([name, template]) => [
      name,
      join(LIBRARY, template.replace(/^lib\//, 'lib-commonjs/').replace('{locale}', env.locale))
    ])
)

const STRING_FILES = new Set(
  Array.from(STRING_MODULES.values(), (file) => pathToFileURL(file).href)
)

/** The one module every stylesheet resolves to: each class name reads as itself. */
const STYLESHEET = 'pp365-integration:stylesheet'

const STYLESHEET_SOURCE =
  'module.exports = new Proxy({}, { get: (_, name) => (name === "__esModule" ? false : String(name)) })'

registerHooks({
  resolve(specifier, context, nextResolve) {
    const strings = STRING_MODULES.get(specifier)
    if (strings) return { url: pathToFileURL(strings).href, format: 'commonjs', shortCircuit: true }
    if (specifier === '@microsoft/sp-lodash-subset') {
      const url = pathToFileURL(join(JEST_CONFIG, 'lib', 'lodashSubset.js')).href
      return { url, format: 'commonjs', shortCircuit: true }
    }
    if (specifier.startsWith('@microsoft/sp-')) {
      const url = pathToFileURL(join(JEST_CONFIG, 'lib', 'spfxStub.js')).href
      return { url, format: 'commonjs', shortCircuit: true }
    }
    if (/\.s?css$/.test(specifier))
      return { url: STYLESHEET, format: 'commonjs', shortCircuit: true }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url === STYLESHEET)
      return { format: 'commonjs', source: STYLESHEET_SOURCE, shortCircuit: true }
    if (STRING_FILES.has(url)) {
      const path = fileURLToPath(url)
      const source = stringsToCommonJs(readFileSync(path, 'utf8'), path)
      return { format: 'commonjs', source, shortCircuit: true }
    }
    return nextLoad(url, context)
  }
})
