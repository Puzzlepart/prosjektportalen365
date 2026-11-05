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
 *   (expected; e.g. re-import, a bundled extension file, or a column type that
 *   sp-js-provisioning widens in place, such as Text to Note).
 * - `skip` — the existing object is left untouched. Either the conflicting entry
 *   is stripped from the provisioning schema (a content type id used by a
 *   *different* content type, a term set id with another name — we never clobber
 *   them), or sp-js-provisioning leaves it alone and logs a warning or an error
 *   (a column type change that would lose values, a field id another column has,
 *   content types on a list it did not create).
 * - `blocked` — provisioning that entry would hard-fail (a content type whose
 *   field reference does not exist on the hub), so it is stripped too.
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
