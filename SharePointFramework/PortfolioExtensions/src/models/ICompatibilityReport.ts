/**
 * What kind of object a {@link ICompatibilityConflict} is about.
 */
export type ConflictKind =
  | 'contentType'
  | 'siteField'
  | 'fieldRef'
  | 'list'
  | 'listField'
  | 'listView'
  | 'extension'
  | 'taxonomy'

/**
 * How a conflict is resolved if the admin chooses to continue the import:
 *
 * - `overwrite` — the package's version replaces/updates the existing object
 *   (expected; e.g. re-import, or a bundled extension file).
 * - `skip` — the conflicting entry is stripped from the provisioning schema so
 *   the existing object is left untouched (e.g. a content type id used by a
 *   *different* content type — we never clobber it).
 * - `blocked` — provisioning that entry would hard-fail (e.g. a field id reused
 *   by a different column, or a missing field reference), so it is stripped too.
 */
export type ConflictResolution = 'overwrite' | 'skip' | 'blocked'

/**
 * A single detected conflict between a package's `hub-template.json` (or its
 * bundled extensions) and what already exists on the hub web.
 */
export interface ICompatibilityConflict {
  kind: ConflictKind
  /** Content type StringId, field GUID, list/view title, or extension filename. */
  targetId: string
  /** Name declared by the package. */
  targetName: string
  /** What currently exists on the hub (the mismatch), when relevant. */
  existingName?: string
  resolution: ConflictResolution
  /** Localized description of the conflict. */
  detail: string
}

/**
 * Result of the pre-import compatibility check (see `CompatibilityService`).
 */
export interface ICompatibilityReport {
  conflicts: ICompatibilityConflict[]
  hasConflicts: boolean
}
