/**
 * Minimal semver comparison utility. Compares the numeric `major.minor.patch`
 * core only (pre-release/build metadata is ignored), which is sufficient for
 * the catalog's "update available" and `minPPVersion` checks.
 */

import { Logger, LogLevel } from '@pnp/logging'

function parse(version: string): number[] {
  if (!version) return [0, 0, 0]
  const core = version.trim().replace(/^v/i, '').split(/[-+]/)[0]
  return core.split('.').map((part) => {
    const n = parseInt(part, 10)
    if (isNaN(n)) {
      // Surface malformed version data instead of silently treating it as 0 —
      // a typo'd `minPPVersion` would otherwise compare as 0.0.0 and never
      // block an install.
      Logger.log({
        message: `(version) Ignoring non-numeric version segment "${part}" in "${version}"`,
        level: LogLevel.Warning
      })
      return 0
    }
    return n
  })
}

/**
 * Returns 1 if `a > b`, -1 if `a < b`, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const pa = parse(a)
  const pb = parse(b)
  const length = Math.max(pa.length, pb.length)
  for (let i = 0; i < length; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

/**
 * Whether `candidate` is strictly newer than `current`.
 */
export function isNewerVersion(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0
}
