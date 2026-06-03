/**
 * A single version entry parsed from a package `CHANGELOG.md` (Keep a
 * Changelog format, `## [x.y.z] - dd/mm/yyyy`). Powers the "Historikk"
 * section of the details panel.
 */
export interface IChangelogEntry {
  /**
   * Version number (e.g. `1.0.1`).
   */
  version: string

  /**
   * Raw date string as written in the changelog heading (e.g. `11/05/2026`).
   */
  date?: string

  /**
   * Change notes (bullet lines) for this version.
   */
  notes: string[]
}
