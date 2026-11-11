import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire, registerHooks } from 'node:module'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { env } from './env.ts'

/**
 * Lets Node load the CommonJS builds (`lib-commonjs`) of the shared library and of the solutions
 * the tests use, as the Jest harness lets Jest:
 *  - the workspace packages, their `lib` folder and its paths, resolve to `lib-commonjs` (`lib` is ESM
 *    for webpack): a solution's import of `pp365-shared-library/lib/data` must reach the same module the
 *    tests load, or the tests' sign-in (`setSpfiFactory`) would not reach the solution's clients;
 *  - a solution's bare imports of its own folders (`types`, `data`, `components/X`; its `baseUrl` is
 *    `src`) resolve in its `lib-commonjs`, as Jest's `moduleDirectories` has them;
 *  - the SPFx string modules each package names in `config/config.json` resolve to their AMD bundles
 *    in `INTEGRATION_LOCALE`, made CommonJS on load;
 *  - `@microsoft/sp-*`, the page's at runtime, resolve to the Jest harness's stand-in, and the
 *    stylesheets a component pulls in to class names.
 * The stubs and the AMD transform are the Jest harness's own (`pp365-jest-config/lib`). Imported
 * for its side effect, before the first module of a package.
 */

const require = createRequire(import.meta.url)

/** A workspace package the tests load: its name and its folder, symbolic links resolved. */
interface IPackage {
  name: string
  folder: string
}

/** The workspace packages the tests load, the library first, whose string modules win. */
const PACKAGES: IPackage[] = ['pp365-shared-library', 'pp365-projectwebparts'].map((name) => ({
  name,
  folder: realpathSync(dirname(require.resolve(`${name}/package.json`)))
}))

/** The shared library's folder, through its workspace link. */
export const LIBRARY = PACKAGES[0].folder

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
 * The string modules the packages name in `config/config.json`, as files in the configured
 * language: SPFx maps `lib/loc/{locale}.js`, the CommonJS build has the same bundles under
 * `lib-commonjs`; a bundle from `node_modules` (the PnP controls') is read where it is. A name
 * keeps its first package's bundle; a bundle that is not there is left out.
 */
const STRING_MODULES = new Map<string, string>()
for (const { folder } of PACKAGES) {
  const resources: Record<string, string> = JSON.parse(
    readFileSync(join(folder, 'config', 'config.json'), 'utf8')
  ).localizedResources
  for (const [name, template] of Object.entries(resources)) {
    if (STRING_MODULES.has(name)) continue
    const file = join(
      folder,
      template.replace(/^lib\//, 'lib-commonjs/').replace('{locale}', env.locale)
    )
    if (existsSync(file)) STRING_MODULES.set(name, realpathSync(file))
  }
}

const STRING_FILES = new Set(
  Array.from(STRING_MODULES.values(), (file) => pathToFileURL(file).href)
)

/**
 * The workspace packages' names, their `lib` folder and its paths, which resolve to `lib-commonjs`.
 * The folder alone (`pp365-shared-library/lib`, as ProjectWebParts' status report data imports it)
 * would otherwise load the ES module build, a second copy of the library.
 */
const WORKSPACE_PACKAGE =
  /^(pp365-shared-library|pp365-projectwebparts|pp365-portfoliowebparts)(?:\/lib(?:\/(.+))?)?$/

/** The package whose `lib-commonjs` a module is in, for its bare imports of its own folders. */
function packageOf(parentURL: string | undefined): IPackage | undefined {
  if (!parentURL?.startsWith('file:')) return undefined
  const path = fileURLToPath(parentURL)
  return PACKAGES.find(({ folder }) => path.startsWith(`${folder}${sep}lib-commonjs${sep}`))
}

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
    // PnP's UI controls, which a solution's barrel pulls in and the tests never render, are ESM
    // written for webpack (directory imports Node refuses): the Jest harness's PnP stand-in.
    if (/^@pnp\/spfx-(controls-react|property-controls)(\/|$)/.test(specifier)) {
      const url = pathToFileURL(join(JEST_CONFIG, 'lib', 'pnpStub.js')).href
      return { url, format: 'commonjs', shortCircuit: true }
    }
    const workspacePackage = WORKSPACE_PACKAGE.exec(specifier)
    if (workspacePackage) {
      const [, name, path] = workspacePackage
      return nextResolve(`${name}/lib-commonjs/${path ?? 'index.js'}`, context)
    }
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      const owner = /^[\w@]/.test(specifier) ? packageOf(context.parentURL) : undefined
      if (!owner) throw error
      return nextResolve(join(owner.folder, 'lib-commonjs', specifier), context)
    }
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
