'use strict'

/**
 * SPFx / Heft webpack customization for this solution.
 *
 * Invoked by the rig task `customize-configure-webpack`
 * (@microsoft/spfx-heft-plugins -> customize-spfx-webpack-configuration-plugin),
 * which taps `onConfigure` at stage Number.MAX_SAFE_INTEGER, i.e. after
 * `third-party-externals-configure-webpack` has appended its externals.
 * The return value is ignored - mutate `webpackConfig` in place.
 *
 * Two responsibilities:
 *
 *  1. Rebuild `resolve.alias` from this solution's tsconfig `compilerOptions.paths`,
 *     pointing at the compiled output folder (`lib`), exactly as the old
 *     gulpfile `build.configureWebpack.mergeConfig({ additionalConfiguration })`
 *     block did.
 *
 *  2. Decision A - keep the linked Rush workspace packages BUNDLED into this
 *     solution's bundles instead of letting Heft turn them into runtime SPFx
 *     component dependencies.
 *
 *     Heft externalizes a linked package when `CumulativeManifestProcessor`
 *     manages to attach a `packageName` to its discovered manifests, which it
 *     only does when the dependency's `dist` folder yields a single component
 *     (or a component plus its assembly). `pp365-shared-library` is exactly
 *     that case after a clean build. `ManifestPlugin` then emits a
 *     `type: "component"` entry in `loaderConfig.scriptResources` - but ONLY
 *     for requests webpack actually turned into an `ExternalModule`. Dropping
 *     the name from `webpackConfig.externals` therefore bundles the code and
 *     removes the runtime component dependency in one move; `linkedExternals`
 *     on its own never emits anything.
 *
 * This file is identical in all six SharePointFramework solutions: the alias
 * block derives everything from the sibling `tsconfig.json` at runtime, and the
 * externals filter is a no-op for names that are not present.
 */

const fs = require('fs')
const path = require('path')
const Module = require('module')

/** Absolute path to the solution root (this file lives in `<solution>/config`). */
const PROJECT_FOLDER = path.resolve(__dirname, '..')

/**
 * Workspace packages that must stay bundled into the consuming solution.
 * Removing a name that is not in `externals` is a no-op, so the same list is
 * safe in every solution (including the packages themselves).
 */
const BUNDLE_LINKED_PACKAGES = [
  'pp365-shared-library',
  'pp365-projectwebparts',
  'pp365-portfoliowebparts'
]

/** Default output folder when no `outDir` can be resolved from the tsconfig chain. */
const DEFAULT_OUT_DIR = 'lib'

/**
 * Legacy package names that must be redirected to their modern equivalents.
 *
 * `office-ui-fabric-react` was renamed to `@fluentui/react` at v8. Some older transitive
 * dependencies (notably `pzl-spfx-components`, which declares no runtime dependencies at all)
 * still import the old name and used to resolve it through npm's flat node_modules. pnpm's
 * strict layout no longer provides it, so map it onto the Fluent v8 copy this solution already
 * bundles. Mapping to an absolute path is deliberate: a bare package name would be resolved
 * relative to the importing module, which cannot see this solution's dependencies.
 */
const COMPAT_ALIASES = { 'office-ui-fabric-react': '@fluentui/react' }

/**
 * Subpaths that exist on disk but are not listed in their package's `exports` map.
 *
 * `@fluentui/react` 8.106.4 exports `./dist/sass/*` but not `./dist/css/*`, while five web parts
 * import `@fluentui/react/dist/css/fabric.min.css` for the Fabric core classes. The gulp toolchain's
 * webpack did not enforce `exports`; the Heft toolchain's does. Aliasing the folder to its absolute
 * location bypasses the export map without changing which file is loaded.
 *
 * Each entry maps an alias prefix to [package name, subpath within that package].
 */
const UNEXPORTED_SUBPATH_ALIASES = {
  '@fluentui/react/dist/css': ['@fluentui/react', 'dist/css']
}

/** Parse a tsconfig-style JSON file (tolerates comments and trailing commas). */
function readJsonc(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const withoutComments = raw.replace(
    /"(?:\\.|[^"\\])*"|\/\/[^\n\r]*|\/\*[\s\S]*?\*\//g,
    (match) => (match.charAt(0) === '"' ? match : '')
  )
  return JSON.parse(withoutComments.replace(/,(\s*[}\]])/g, '$1'))
}

/** Resolve a tsconfig `extends` specifier (relative path or package name). */
function resolveExtends(specifier, fromFile) {
  if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
    const base = path.resolve(path.dirname(fromFile), specifier)
    const candidates = [base, `${base}.json`, path.join(base, 'tsconfig.json')]
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
    }
    return undefined
  }
  const requireFrom = Module.createRequire(fromFile)
  for (const candidate of [specifier, `${specifier}/tsconfig.json`]) {
    try {
      return requireFrom.resolve(candidate)
    } catch (e) {
      /* try the next form */
    }
  }
  return undefined
}

/**
 * Walk the tsconfig `extends` chain and return the effective `paths` (nearest
 * declaration wins) and the absolute `outDir` (resolved against the file that
 * declared it - the rig base declares it as `../../../../../lib`).
 */
function readTsconfig(filePath, seen) {
  if (!filePath || seen.has(filePath)) return {}
  seen.add(filePath)
  let json
  try {
    json = readJsonc(filePath)
  } catch (e) {
    return {}
  }
  const compilerOptions = json.compilerOptions || {}
  const extendsList = Array.isArray(json.extends)
    ? json.extends
    : json.extends
      ? [json.extends]
      : []
  let inherited = {}
  for (const specifier of extendsList) {
    const resolved = readTsconfig(resolveExtends(specifier, filePath), seen)
    inherited = {
      paths: resolved.paths || inherited.paths,
      outDir: resolved.outDir || inherited.outDir
    }
  }
  return {
    paths: compilerOptions.paths || inherited.paths,
    outDir: compilerOptions.outDir
      ? path.resolve(path.dirname(filePath), compilerOptions.outDir)
      : inherited.outDir
  }
}

/** Strip a trailing `/*` from a tsconfig path key or value. */
function stripWildcard(value) {
  return String(value).replace(/[\\/]\*$/, '')
}

/** Resolve a package's root folder from this solution, or undefined when it is not installed. */
function resolvePackageRoot(packageName) {
  try {
    const requireFromSolution = Module.createRequire(path.join(PROJECT_FOLDER, 'package.json'))
    return path.dirname(requireFromSolution.resolve(`${packageName}/package.json`))
  } catch (e) {
    return undefined
  }
}

/** tsconfig `compilerOptions.paths` -> webpack `resolve.alias`, rooted at `outDir`, plus compat aliases. */
function applyTsconfigAliases(webpackConfig, log) {
  const { paths, outDir } = readTsconfig(path.join(PROJECT_FOLDER, 'tsconfig.json'), new Set())
  const outDirPath = outDir || path.join(PROJECT_FOLDER, DEFAULT_OUT_DIR)
  webpackConfig.resolve = webpackConfig.resolve || {}
  const alias = { ...(webpackConfig.resolve.alias || {}) }
  for (const key of Object.keys(paths || {})) {
    const target = Array.isArray(paths[key]) ? paths[key][0] : paths[key]
    if (!target) continue
    alias[stripWildcard(key)] = path.join(outDirPath, stripWildcard(target))
  }
  for (const [legacyName, modernName] of Object.entries(COMPAT_ALIASES)) {
    if (alias[legacyName]) continue
    const modernRoot = resolvePackageRoot(modernName)
    if (modernRoot) {
      alias[legacyName] = modernRoot
      log(`compat alias: ${legacyName} -> ${modernName}`)
    }
  }
  for (const [request, [packageName, subPath]] of Object.entries(UNEXPORTED_SUBPATH_ALIASES)) {
    if (alias[request]) continue
    const packageRoot = resolvePackageRoot(packageName)
    if (packageRoot) {
      alias[request] = path.join(packageRoot, subPath)
      log(`unexported subpath alias: ${request}`)
    }
  }
  webpackConfig.resolve.alias = alias
  log(`resolve.alias: ${Object.keys(alias).join(', ') || '(none)'} -> ${outDirPath}`)

  // Node core modules that transitive dependencies probe for but do not need in a browser.
  // `sax` (pulled in by the XML tooling) does `try { require('stream') } catch { /* fallback */ }`;
  // webpack 5 no longer polyfills Node builtins and reports the unresolved request as a warning on
  // every build. Declaring it as `false` resolves it to an empty module, which the existing catch
  // path already handles, and keeps the build log free of noise that would mask real warnings.
  webpackConfig.resolve.fallback = { stream: false, ...(webpackConfig.resolve.fallback || {}) }
}

/** Remove the workspace package names from a webpack `externals` value. */
function withoutBundledPackages(externals) {
  if (!Array.isArray(externals)) return externals
  return externals.filter(
    (entry) => !(typeof entry === 'string' && BUNDLE_LINKED_PACKAGES.indexOf(entry) !== -1)
  )
}

/**
 * Decision A: keep the linked workspace packages bundled.
 *
 * `externals` is left by the SPFx generator as a plain array of strings
 * (`WebpackConfigurationGenerator.js`, `externals: Array.from(externalsKeys)`),
 * and `third-party-externals-plugin` later reassigns it with its own entries
 * appended. This hook is registered after that one and therefore normally sees
 * the final array - but rather than depend on the rig's task declaration order,
 * install the filter as a property setter so that ANY later assignment is
 * filtered too. Falls back to a one-shot filter if the property cannot be
 * redefined.
 */
function keepLinkedPackagesBundled(webpackConfig, log) {
  const removed = Array.isArray(webpackConfig.externals)
    ? webpackConfig.externals.filter(
        (entry) => typeof entry === 'string' && BUNDLE_LINKED_PACKAGES.indexOf(entry) !== -1
      )
    : []
  let current = withoutBundledPackages(webpackConfig.externals)
  try {
    Object.defineProperty(webpackConfig, 'externals', {
      configurable: true,
      enumerable: true,
      get() {
        return current
      },
      set(value) {
        current = withoutBundledPackages(value)
      }
    })
  } catch (e) {
    webpackConfig.externals = current
  }
  log(
    removed.length > 0
      ? `Keeping linked package(s) bundled (removed from externals): ${removed.join(', ')}`
      : 'No linked workspace packages were externalized; nothing to remove.'
  )
}

/**
 * @param {import('webpack').Configuration} webpackConfig
 * @param {{ logger: { terminal: { writeVerboseLine: (message: string) => void } } }} taskSession
 */
module.exports = function customizeWebpackConfiguration(webpackConfig, taskSession) {
  const log = (message) => {
    try {
      taskSession.logger.terminal.writeVerboseLine(`[spfx-customize-webpack] ${message}`)
    } catch (e) {
      /* logging is best-effort */
    }
  }
  const configurations = Array.isArray(webpackConfig) ? webpackConfig : [webpackConfig]
  for (const configuration of configurations) {
    if (!configuration) continue
    applyTsconfigAliases(configuration, log)
    keepLinkedPackagesBundled(configuration, log)
  }
}
