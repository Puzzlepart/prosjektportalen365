/**
 * Phase 2 helper: move every solution from PnPjs 3.17.0 to 4.21.0 and drop the packages we vendored.
 *
 * Idempotent. Run from the repo root: node docs/plans/pnpjs-4-migration-bump.js [--dry]
 * Delete this file once Phase 2 has shipped.
 */
const fs = require('fs')
const path = require('path')

const DRY = process.argv.includes('--dry')
const ROOT = path.resolve(__dirname, '../..')
const SPFX = path.join(ROOT, 'SharePointFramework')
const SOLUTIONS = ['shared-library', 'PortfolioExtensions', 'PortfolioWebParts', 'ProgramWebParts', 'ProjectExtensions', 'ProjectWebParts']

const PNP_VERSION = '4.21.0'
const PNP_PACKAGES = ['@pnp/sp', '@pnp/core', '@pnp/queryable', '@pnp/logging', '@pnp/graph']

/**
 * Companion pins that must follow PnPjs. @pnp/graph@4.21.0 depends on exactly this version of the Graph
 * typings; a solution that pins another version types the same Planner objects from two copies.
 */
const COMPANION_VERSIONS = { '@microsoft/microsoft-graph-types': '2.43.0' }

/** Vendored into shared-library/src/services/EntityPortalService, so no longer a dependency. */
const VENDORED = ['sp-entityportal-service']

/**
 * sp-js-provisioning moves to a PnPjs v4 build published as 1.4.0 (a minor, by maintainer decision),
 * which declares @pnp/* as peer dependencies. Only the three solutions that actually import it keep it; shared-library pinned it
 * without importing it anywhere.
 */
const PROVISIONING = 'sp-js-provisioning'
const PROVISIONING_IMPORTERS = ['PortfolioExtensions', 'ProjectExtensions']
/**
 * The PnPjs v4 build of sp-js-provisioning is not on npm yet, so the version is only rewritten when
 * it is passed explicitly: `node docs/plans/pnpjs-4-migration-bump.js --provisioning-version=1.4.0`.
 * Without the flag the existing version is left alone (so `rush update` still resolves) and the
 * package is still dropped from the solutions that never imported it.
 */
const PROVISIONING_VERSION = (process.argv.find((a) => a.startsWith('--provisioning-version=')) || '').split('=')[1]

const changes = []
for (const solution of SOLUTIONS) {
  const file = path.join(SPFX, solution, 'package.json')
  const raw = fs.readFileSync(file, 'utf8')
  const pkg = JSON.parse(raw)
  const log = (m) => changes.push(`${solution}: ${m}`)

  for (const field of ['dependencies', 'devDependencies']) {
    for (const name of PNP_PACKAGES) {
      if (pkg[field] && pkg[field][name] && pkg[field][name] !== PNP_VERSION) {
        log(`${field}.${name} ${pkg[field][name]} -> ${PNP_VERSION}`)
        pkg[field][name] = PNP_VERSION
      }
    }
    for (const [name, version] of Object.entries(COMPANION_VERSIONS)) {
      if (pkg[field] && pkg[field][name] && pkg[field][name] !== version) {
        log(`${field}.${name} ${pkg[field][name]} -> ${version}`)
        pkg[field][name] = version
      }
    }
    for (const name of VENDORED) {
      if (pkg[field] && pkg[field][name]) {
        log(`remove ${field}.${name}@${pkg[field][name]} (vendored into shared-library)`)
        delete pkg[field][name]
      }
    }
    if (pkg[field] && pkg[field][PROVISIONING]) {
      if (!PROVISIONING_IMPORTERS.includes(solution)) {
        log(`remove ${field}.${PROVISIONING}@${pkg[field][PROVISIONING]} (never imported here)`)
        delete pkg[field][PROVISIONING]
      } else if (PROVISIONING_VERSION && pkg[field][PROVISIONING] !== PROVISIONING_VERSION) {
        log(`${field}.${PROVISIONING} ${pkg[field][PROVISIONING]} -> ${PROVISIONING_VERSION}`)
        pkg[field][PROVISIONING] = PROVISIONING_VERSION
      }
    }
  }

  const out = JSON.stringify(pkg, null, 2) + (raw.endsWith('\n') ? '\n' : '')
  if (out !== raw && !DRY) fs.writeFileSync(file, out)
}
console.log(changes.length ? changes.join('\n') : 'no changes')
console.log(`\n${changes.length} change(s)${DRY ? ' (dry run)' : ' written'}`)
