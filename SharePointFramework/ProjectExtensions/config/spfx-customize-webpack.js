'use strict'

/**
 * Heft webpack customization: compiled-path aliases, bundled workspace dependencies,
 * third-party CSS and Node compatibility, and live reload.
 *
 * The rig invokes this after its externals configuration. Its return value is ignored,
 * so configuration changes must be made in place.
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
      // Package exports may expose either the specifier or its tsconfig.json entry.
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
  webpackConfig.resolve.alias = alias
  log(`resolve.alias: ${Object.keys(alias).join(', ') || '(none)'} -> ${outDirPath}`)

  // `sax` (reached through the XML tooling) does `try { require('stream') } catch { /* fallback */ }`.
  // webpack 5 no longer polyfills Node builtins and reports the unresolved request as a warning on
  // every build. Resolve it to an empty module, which sax's own catch path already handles.
  //
  // Deliberately scoped to sax with a module rule rather than set resolver-wide: a repo-wide
  // `resolve.fallback` would also silence a genuine missing polyfill anywhere else in the bundle,
  // turning a build error into a runtime failure.
  webpackConfig.module = webpackConfig.module || {}
  webpackConfig.module.rules = webpackConfig.module.rules || []
  webpackConfig.module.rules.push({
    test: /[\\/]node_modules[\\/]sax[\\/]/,
    resolve: { fallback: { stream: false } }
  })
}

/** Remove the workspace package names from a webpack `externals` value. */
function withoutBundledPackages(externals) {
  if (!Array.isArray(externals)) return externals
  return externals.filter(
    (entry) => !(typeof entry === 'string' && BUNDLE_LINKED_PACKAGES.indexOf(entry) !== -1)
  )
}

/**
 * Keeps workspace packages bundled rather than emitted as runtime SPFx component dependencies.
 * A setter also filters later rig assignments; nonconfigurable properties get a one-shot filter.
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
 * Routes plain third-party CSS through the rig's global loader.
 * The default CSS-module rule hashes library class names that their DOM expects unchanged.
 */
function treatNodeModulesCssAsGlobal(webpackConfig, log) {
  const rules = webpackConfig?.module?.rules
  if (!Array.isArray(rules)) return
  const NODE_MODULES = /[\\/]node_modules[\\/]/
  // Bundled workspace packages still need CSS-module exports; treating them as global loses styles.
  const WORKSPACE_PACKAGE = /[\\/]node_modules[\\/]pp365-[^\\/]+[\\/]/
  const CSS_MODULE_FILE = /\.module\.(?:s[ac]ss|css)(?:\.css)?$/i
  const isThirdPartyGlobalCss = (resourcePath) =>
    NODE_MODULES.test(resourcePath) &&
    !WORKSPACE_PACKAGE.test(resourcePath) &&
    !CSS_MODULE_FILE.test(resourcePath)
  const isRegExp = (value) => value instanceof RegExp
  const moduleRule = rules.find(
    (rule) => isRegExp(rule?.test) && rule.test.source.startsWith('(?<!\\.global') && rule.test.source.endsWith('\\.css$')
  )
  const globalRule = rules.find(
    (rule) => isRegExp(rule?.test) && rule.test.source.startsWith('\\.global') && rule.test.source.endsWith('\\.css$')
  )
  if (!moduleRule || !globalRule) {
    log('CSS rules of the rig not found; node_modules stylesheets keep the default handling')
    return
  }
  moduleRule.exclude = moduleRule.exclude
    ? [].concat(moduleRule.exclude, isThirdPartyGlobalCss)
    : isThirdPartyGlobalCss
  rules.splice(rules.indexOf(globalRule) + 1, 0, {
    ...globalRule,
    test: /\.css$/i,
    include: isThirdPartyGlobalCss
  })
  log('third-party .css files from node_modules are compiled as global stylesheets')
}

/**
 * Provides Buffer for dependencies such as xml-js when this solution declares the polyfill.
 * Webpack 5 no longer injects Node globals automatically.
 */
function provideNodeGlobals(webpackConfig, webpack, log) {
  const bufferRoot = resolvePackageRoot('buffer')
  if (!bufferRoot) return
  if (!webpack || !webpack.ProvidePlugin) {
    log('buffer is installed but the webpack instance was not passed to the hook; Buffer is not provided')
    return
  }
  webpackConfig.plugins = webpackConfig.plugins || []
  webpackConfig.plugins.push(
    new webpack.ProvidePlugin({ Buffer: [path.join(bufferRoot, 'index.js'), 'Buffer'] })
  )
  log('Buffer provided from the buffer package')
}

/**
 * Uses page reloads because independent SPFx webpack runtimes cannot reliably share HMR updates.
 */
function reloadPageOnRebuild(webpackConfig, log) {
  if (!webpackConfig.devServer) return
  webpackConfig.devServer.hot = false
  webpackConfig.devServer.liveReload = true
  log('dev server: hot module replacement off, the page reloads after each rebuild')
}

/** Applies solution-specific compatibility rules to each configuration supplied by Heft. */
module.exports = function customizeWebpackConfiguration(webpackConfig, taskSession, heftConfiguration, webpack) {
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
    treatNodeModulesCssAsGlobal(configuration, log)
    provideNodeGlobals(configuration, webpack, log)
    reloadPageOnRebuild(configuration, log)
  }
}
