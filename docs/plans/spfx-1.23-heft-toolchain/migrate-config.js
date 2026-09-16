/**
 * Phase 1 helper: scaffold the Heft config files for every SPFx solution and retire the gulp ones.
 *
 * Idempotent. Run from the repo root: node docs/plans/spfx-1.23-heft-toolchain/migrate-config.js [--dry]
 * Writes: config/rig.json, config/sass.json, config/typescript.json, tsconfig.json, .gitignore additions,
 *         .yo-rc.json updates. Does NOT delete gulpfile.js / src/index.ts (done separately) and does NOT
 *         write eslint.config.js or config/spfx-customize-webpack.js (content depends on preflight results).
 *
 * Delete this file once Phase 1 has shipped.
 */
const fs = require('fs')
const path = require('path')

const DRY = process.argv.includes('--dry')
const ROOT = path.resolve(__dirname, '../../..')
const SPFX = path.join(ROOT, 'SharePointFramework')
const LIBRARY = 'shared-library'
const SOLUTIONS = [LIBRARY, 'PortfolioExtensions', 'PortfolioWebParts', 'ProgramWebParts', 'ProjectExtensions', 'ProjectWebParts']
const SPFX_VERSION = '1.23.2'
const TEAMS_JS = '2.24.0'

/**
 * lib entries the rig's tsconfig-base already provides; we union them with each solution's own list.
 *
 * `es2020` is added on top for every solution. `lib` only declares which type definitions are
 * available - it does not affect emitted JavaScript, which `target: es5` still governs - and the
 * code already calls Object.entries/values/fromEntries, Array.flat/flatMap and String.padStart,
 * which need es2017 to es2019. The six solutions had drifted to different (too narrow) lists;
 * shared-library was the only one with es2020, which is why it was the only one that compiled.
 * SPFx runs only on evergreen browsers, all of which implement ES2020.
 */
const RIG_LIB = ['dom', 'es5', 'es2015.core', 'es2015.collection', 'es2015.iterable', 'es2015.promise', 'es2015.proxy', 'es2020']

const changes = []
const write = (file, content) => {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (existing === content) return false
  if (!DRY) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  changes.push(`${path.relative(ROOT, file)} ${existing === null ? 'created' : 'replaced'}`)
  return true
}
const json = (value) => JSON.stringify(value, null, 2) + '\n'
/** strips // and /* *\/ comments so JSON.parse can read a tsconfig */
const readJsonc = (file) =>
  JSON.parse(
    fs
      .readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
  )

for (const solution of SOLUTIONS) {
  const dir = path.join(SPFX, solution)

  write(
    path.join(dir, 'config/rig.json'),
    json({
      $schema: 'https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json',
      rigPackageName: '@microsoft/spfx-web-build-rig'
    })
  )

  write(
    path.join(dir, 'config/sass.json'),
    json({
      $schema: 'https://developer.microsoft.com/json-schemas/heft/v0/heft-sass-plugin.schema.json',
      extends: '@microsoft/spfx-web-build-rig/profiles/default/config/sass.json'
    })
  )

  // The rig's copy-javascript task already copies src/**/*.js (our loc bundles) into lib;
  // includeGlobs is belt and braces for src/loc/**.js and src/loc/shared/**.js.
  write(
    path.join(dir, 'config/typescript.json'),
    json({
      extends: '@microsoft/spfx-web-build-rig/profiles/default/config/typescript.json',
      staticAssetsToCopy: {
        fileExtensions: ['.resx', '.jpg', '.png', '.woff', '.eot', '.ttf', '.svg', '.gif'],
        includeGlobs: ['loc/**/*.js']
      }
    })
  )

  // tsconfig: extend the rig base, then restore this solution's current looseness and module resolution.
  const tsconfigPath = path.join(dir, 'tsconfig.json')
  const current = readJsonc(tsconfigPath)
  const co = current.compilerOptions || {}
  const compilerOptions = {
    strict: false,
    noImplicitAny: false,
    strictNullChecks: false,
    useUnknownInCatchVariables: false,
    noUnusedLocals: false,
    downlevelIteration: true,
    allowSyntheticDefaultImports: true,
    lib: Array.from(new Set([...RIG_LIB, ...(co.lib || [])]))
  }
  if (co.paths && Object.keys(co.paths).length) {
    compilerOptions.baseUrl = co.baseUrl || 'src'
    compilerOptions.paths = co.paths
  }
  write(
    tsconfigPath,
    json({
      extends: './node_modules/@microsoft/spfx-web-build-rig/profiles/default/tsconfig-base.json',
      compilerOptions
    })
  )

  // .gitignore: Heft output folders, only the ones missing
  const gitignorePath = path.join(dir, '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const before = fs.readFileSync(gitignorePath, 'utf8')
    const lines = before.split('\n').map((l) => l.trim())
    const missing = ['lib-commonjs', 'lib-dts', 'lib-esm', 'jest-output', '.heft'].filter((e) => !lines.includes(e))
    if (missing.length) {
      const after = before.replace(/\n*$/, '\n') + missing.join('\n') + '\n'
      if (!DRY) fs.writeFileSync(gitignorePath, after)
      changes.push(`${solution}/.gitignore += ${missing.join(', ')}`)
    }
  }

  // .yo-rc.json: generator version + useGulp false; teams-js only where a SDK block already exists
  const yoPath = path.join(dir, '.yo-rc.json')
  if (fs.existsSync(yoPath)) {
    const yo = JSON.parse(fs.readFileSync(yoPath, 'utf8'))
    const gen = yo['@microsoft/generator-sharepoint'] || (yo['@microsoft/generator-sharepoint'] = {})
    const notes = []
    if (gen.version !== SPFX_VERSION) {
      notes.push(`version ${gen.version} -> ${SPFX_VERSION}`)
      gen.version = SPFX_VERSION
    }
    if (gen.useGulp !== false) {
      notes.push('useGulp -> false')
      gen.useGulp = false
    }
    // PortfolioExtensions spells the key "sdksVersions"; update in place rather than adding a second key
    for (const key of ['sdksVersions', 'sdkVersions']) {
      if (gen[key] && gen[key]['@microsoft/teams-js'] && gen[key]['@microsoft/teams-js'] !== TEAMS_JS) {
        notes.push(`${key}["@microsoft/teams-js"] ${gen[key]['@microsoft/teams-js']} -> ${TEAMS_JS}`)
        gen[key]['@microsoft/teams-js'] = TEAMS_JS
      }
    }
    if (notes.length) {
      if (!DRY) fs.writeFileSync(yoPath, json(yo))
      changes.push(`${solution}/.yo-rc.json: ${notes.join('; ')}`)
    }
  }
}

console.log(changes.length ? changes.join('\n') : 'no changes (already scaffolded)')
console.log(`\n${changes.length} change(s)${DRY ? ' (dry run, nothing written)' : ' written'}`)
