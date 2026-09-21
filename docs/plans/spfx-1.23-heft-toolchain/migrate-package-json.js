/**
 * Phase 1 helper: rewrite every SPFx solution's package.json for the SPFx 1.23.2 Heft toolchain.
 *
 * Idempotent. Run from the repo root:  node docs/plans/spfx-1.23-heft-toolchain/migrate-package-json.js
 * Add --dry to print the changes without writing.
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
const NODE_ENGINE = '>=22.14.0 <23.0.0'

/** Packages dropped everywhere they appear (gulp toolchain, dead deps, ESLint 8 stack). */
const REMOVE = [
  '@microsoft/sp-build-web',
  '@microsoft/rush-stack-compiler-4.5',
  'gulp',
  'ajv',
  'webpack',
  'concurrently',
  'livereload',
  'find',
  'colors',
  'yargs',
  '@typescript-eslint/parser',
  '@typescript-eslint/eslint-plugin',
  '@pnp/odata',
  '@pnp/sp-taxonomy',
  'jsom-ctx',
  // moved into the pp365-eslint-config Rush project, which owns the whole lint stack
  '@microsoft/eslint-config-spfx',
  '@microsoft/eslint-plugin-spfx',
  '@rushstack/eslint-config',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'eslint-plugin-unused-imports'
]

/** devDependencies every solution gets, at these exact versions. */
const DEV = {
  '@microsoft/sp-module-interfaces': SPFX_VERSION,
  '@microsoft/spfx-heft-plugins': SPFX_VERSION,
  '@microsoft/spfx-web-build-rig': SPFX_VERSION,
  '@rushstack/heft': '1.2.17',
  '@types/heft-jest': '1.0.2',
  '@types/jest': '30.0.0',
  'css-loader': '7.1.2',
  // The whole ESLint plugin stack lives in this workspace project; solutions only need
  // eslint itself (Heft resolves it from the project) and prettier for `npm run prettier`.
  // It must use the workspace protocol: Rush runs pnpm with --link-workspace-packages false,
  // so a plain version range is fetched from the registry, and this package is private.
  'pp365-eslint-config': 'workspace:*',
  // Testing harness (see .development-guide/spfx/testing.md)
  'pp365-jest-config': 'workspace:*',
  '@testing-library/react': '12.1.5',
  '@testing-library/dom': '8.20.1',
  '@testing-library/jest-dom': '6.6.3',
  '@testing-library/user-event': '14.6.7',
  eslint: '9.37.0',
  prettier: '3.9.7',
  typescript: '~5.8.3'
}

/** Bumped only where the package is already present. */
const BUMP_IF_PRESENT = {
  '@microsoft/decorators': SPFX_VERSION,
  '@fluentui/react': '8.106.4',
  '@pnp/spfx-controls-react': '3.25.0',
  '@pnp/spfx-property-controls': '3.24.0',
  tslib: '2.8.1',
  '@types/webpack-env': '~1.15.2',
  moment: '~2.29.4',
  '@reduxjs/toolkit': '~1.9.5',
  'pzl-react-reusable-components': '~0.3.1'
}

const scriptsFor = (solution, existing) => {
  const s = { ...existing }
  // `heft test` runs the build phase first and then Jest, so this is a superset of `heft build`.
  // The Jest plugin defaults to passWithNoTests, so solutions without tests are unaffected, and
  // adding a test to any solution makes it gate both `npm run build` and CI.
  s.build = 'heft test --clean --production && heft package-solution --production'
  s.test = 'heft test'
  s.clean = 'heft clean'
  if (solution !== LIBRARY) {
    s.start = 'heft start'
    s.watch = 'heft start --nobrowser'
    s['eject-webpack'] = 'heft eject-webpack'
    delete s.serve // gulp serve-deprecated; heft start replaces it
  }
  if (s.postversion) s.postversion = 'heft build --production && npm publish'
  // Prettier first, so ESLint's prettier/prettier rule sees formatted code.
  s.lint = 'npm run prettier && eslint ./src --fix'
  // Double quotes so the glob survives Windows cmd/PowerShell; --log-level warn keeps
  // real parse errors and deprecation notices visible (silent hid them for years).
  s.prettier = 'prettier "**/*.ts*" --write --log-level warn --config ../.prettierrc.yaml'
  return s
}

const changes = []
for (const solution of SOLUTIONS) {
  const file = path.join(SPFX, solution, 'package.json')
  const raw = fs.readFileSync(file, 'utf8')
  const pkg = JSON.parse(raw)
  const log = (msg) => changes.push(`${solution}: ${msg}`)

  for (const name of REMOVE) {
    for (const field of ['dependencies', 'devDependencies']) {
      if (pkg[field] && pkg[field][name]) {
        log(`remove ${field}.${name}@${pkg[field][name]}`)
        delete pkg[field][name]
      }
    }
  }

  // every @microsoft/sp-* dependency follows the SPFx version
  for (const field of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(pkg[field] || {})) {
      if (name.startsWith('@microsoft/sp-') && pkg[field][name] !== SPFX_VERSION) {
        log(`${field}.${name} ${pkg[field][name]} -> ${SPFX_VERSION}`)
        pkg[field][name] = SPFX_VERSION
      }
    }
  }

  for (const [name, version] of Object.entries(BUMP_IF_PRESENT)) {
    for (const field of ['dependencies', 'devDependencies']) {
      if (pkg[field] && pkg[field][name] && pkg[field][name] !== version) {
        log(`${field}.${name} ${pkg[field][name]} -> ${version}`)
        pkg[field][name] = version
      }
    }
  }

  pkg.devDependencies = pkg.devDependencies || {}
  for (const [name, version] of Object.entries(DEV)) {
    // a toolchain package must never linger in dependencies
    if (pkg.dependencies && pkg.dependencies[name]) {
      log(`move ${name} from dependencies to devDependencies`)
      delete pkg.dependencies[name]
    }
    if (pkg.devDependencies[name] !== version) {
      log(`devDependencies.${name} ${pkg.devDependencies[name] || '(new)'} -> ${version}`)
      pkg.devDependencies[name] = version
    }
  }

  const before = JSON.stringify(pkg.scripts)
  pkg.scripts = scriptsFor(solution, pkg.scripts || {})
  if (JSON.stringify(pkg.scripts) !== before) log('scripts rewritten for Heft')

  if (!pkg.engines || pkg.engines.node !== NODE_ENGINE) {
    log(`engines.node ${(pkg.engines && pkg.engines.node) || '(new)'} -> ${NODE_ENGINE}`)
    pkg.engines = { ...(pkg.engines || {}), node: NODE_ENGINE }
  }

  // pnpm ignores "resolutions"/"overrides" in a workspace package and warns about them;
  // version pinning belongs in common/config/rush/pnpm-config.json globalOverrides.
  for (const field of ['resolutions', 'overrides']) {
    if (pkg[field]) {
      log(`remove ${field} ${JSON.stringify(pkg[field])} (belongs in pnpm-config.json globalOverrides)`)
      delete pkg[field]
    }
  }

  // PortfolioExtensions: nothing imports pp365-portfolioextensions, and src/index.ts goes away
  if (solution === 'PortfolioExtensions' && pkg.main) {
    log(`remove main (${pkg.main}); no consumer imports this package`)
    delete pkg.main
  }

  const out = JSON.stringify(pkg, null, 2) + (raw.endsWith('\n') ? '\n' : '')
  if (out !== raw && !DRY) fs.writeFileSync(file, out)
}

console.log(changes.length ? changes.join('\n') : 'no changes (already migrated)')
console.log(`\n${changes.length} change(s)${DRY ? ' (dry run, nothing written)' : ' written'}`)
