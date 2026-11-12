import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/content-types'
import '@pnp/sp/views'
import '@pnp/sp/files'
import { getTermStore, format } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import { ICompatibilityConflict, ICompatibilityReport, IPackageManifest } from 'models'
import { featureFlags } from './featureFlags'
import { ProjectExtensionsService } from './ProjectExtensionsService'

const normGuid = (value?: string): string => (value ?? '').replace(/[{}]/g, '').toLowerCase()
const normCtId = (value?: string): string => (value ?? '').toLowerCase()

/** Extract a field XML attribute (e.g. ID, Name, Type) from a `<Field .../>`. */
function attr(xml: string, name: string): string | undefined {
  const m = new RegExp(`\\b${name}=["']([^"']+)["']`, 'i').exec(xml)
  return m ? m[1] : undefined
}

/**
 * The type a field XML declares, with `Mult="TRUE"` on a Lookup, User or taxonomy
 * field read as the multi-value type SharePoint reports (`TypeAsString`), as
 * sp-js-provisioning's `declaredType` reads it.
 */
function declaredType(xml: string): string | undefined {
  const type = attr(xml, 'Type')
  const multi = /^true$/i.test(attr(xml, 'Mult') ?? '')
  if (multi && (type === 'Lookup' || type === 'User')) return `${type}Multi`
  if (multi && type === 'TaxonomyFieldType') return 'TaxonomyFieldTypeMulti'
  return type
}

/**
 * The type changes sp-js-provisioning applies to an existing column in place,
 * keeping its values. Any other type change would lose values, so it leaves the
 * column as it is and logs a warning.
 */
const WIDENING: Record<string, string> = {
  Text: 'Note',
  Lookup: 'LookupMulti',
  User: 'UserMulti'
}

/**
 * How a package's field type relates to the stored one, as sp-js-provisioning's
 * `typeChange` decides it: the same, a widening, or another change.
 *
 * @param stored - The existing column's `TypeAsString`
 * @param declared - The package's type ({@link declaredType})
 */
function typeChange(stored?: string, declared?: string): 'same' | 'widening' | 'other' {
  if (!stored || !declared || stored === declared) return 'same'
  return WIDENING[stored] === declared ? 'widening' : 'other'
}

/**
 * Pre-flight compatibility check for the import (Mode A) and publish-as-cloud-
 * template (Mode B) flows: compares a package's `hub-template.json` (and, for
 * imports, its bundled extensions) against what already exists on the hub web,
 * and reports conflicts so the admin can fix them manually or continue knowing
 * items will be overwritten or skipped.
 *
 * Read-only — never mutates the hub. Resolution semantics: see
 * {@link ICompatibilityReport}.
 */
export class CompatibilityService {
  /**
   * Run the compatibility check. Site columns and list fields are reported as
   * sp-js-provisioning 1.5.1 handles them: an existing one is updated in place by
   * its internal name (list fields by their id), never deleted; a widening type
   * change is applied, any other type change leaves it as it is.
   *
   * @param featureFlagProvisioning - Taxonomy feature-flag opt-out (see `featureFlags`)
   * @param options - `schema` overrides the hub schema read from the zip — the
   * publish flow passes its already-filtered subset so only entries that will
   * actually be applied are checked. `includeExtensions: false` skips the
   * Prosjekttillegg check (publish never writes extensions).
   */
  public static async check(
    zip: any,
    manifest: IPackageManifest,
    featureFlagProvisioning?: boolean,
    options: { schema?: any; includeExtensions?: boolean } = {}
  ): Promise<ICompatibilityReport> {
    const conflicts: ICompatibilityConflict[] = []
    try {
      const schema = options.schema ?? (await CompatibilityService._readHubSchema(zip, manifest))
      if (schema) {
        const web = SPDataAdapter.portalDataService.web

        const needFields =
          (schema.SiteFields?.length ?? 0) > 0 ||
          (schema.ContentTypes ?? []).some((ct: any) => (ct.FieldRefs?.length ?? 0) > 0)
        const existingFields: any[] = needFields
          ? await web.fields.select('Id', 'InternalName', 'StaticName', 'TypeAsString').top(5000)()
          : []
        const existingCts: any[] =
          (schema.ContentTypes?.length ?? 0) > 0
            ? await web.contentTypes.select('StringId', 'Name')()
            : []

        CompatibilityService._checkContentTypes(schema, existingCts, existingFields, conflicts)
        CompatibilityService._checkSiteFields(schema, existingFields, conflicts)
        await CompatibilityService._checkLists(web, schema, conflicts)

        if (
          schema.Taxonomy &&
          featureFlags.enableTaxonomyProvisioning({ featureFlagProvisioning })
        ) {
          await CompatibilityService._checkTaxonomy(schema, conflicts)
        }
      }
      if (options.includeExtensions !== false) {
        await CompatibilityService._checkExtensions(manifest, conflicts)
      }
    } catch (error) {
      Logger.log({
        message: `(CompatibilityService) check failed: ${error?.message}`,
        level: LogLevel.Warning
      })
    }
    return { conflicts, hasConflicts: conflicts.length > 0 }
  }

  private static async _readHubSchema(
    zip: any,
    manifest: IPackageManifest
  ): Promise<any | undefined> {
    const hubTemplate = manifest.provisioning?.hubTemplate
    if (!hubTemplate) return undefined
    const file = zip.file(hubTemplate)
    if (!file) return undefined
    try {
      return JSON.parse(await file.async('string'))
    } catch {
      return undefined
    }
  }

  private static _checkContentTypes(
    schema: any,
    existingCts: any[],
    existingFields: any[],
    conflicts: ICompatibilityConflict[]
  ): void {
    const cts = schema.ContentTypes ?? []
    if (cts.length === 0) return
    const ctByStringId = new Map(existingCts.map((c) => [normCtId(c.StringId), c]))
    const fieldNames = new Set(
      existingFields.map((f) => (f.InternalName ?? '').toLowerCase()).filter(Boolean)
    )
    // Fields the package itself declares (SiteFields) also satisfy a FieldRef.
    for (const xml of schema.SiteFields ?? []) {
      const name = attr(String(xml), 'Name') || attr(String(xml), 'StaticName')
      if (name) fieldNames.add(name.toLowerCase())
    }

    for (const ct of cts) {
      const existing = ctByStringId.get(normCtId(ct.ID))
      if (existing && (existing.Name ?? '') !== (ct.Name ?? '')) {
        conflicts.push({
          kind: 'contentType',
          targetId: ct.ID,
          targetName: ct.Name,
          existingName: existing.Name,
          resolution: 'skip',
          detail: format(strings.CatalogConflictContentType, ct.Name, existing.Name)
        })
      }
      for (const ref of ct.FieldRefs ?? []) {
        const refName: string = ref?.Name ?? ''
        if (refName && !fieldNames.has(refName.toLowerCase())) {
          conflicts.push({
            kind: 'fieldRef',
            targetId: refName,
            targetName: ct.Name,
            existingName: refName,
            resolution: 'blocked',
            detail: format(strings.CatalogConflictFieldRef, ct.Name, refName)
          })
        }
      }
    }
  }

  private static _checkSiteFields(
    schema: any,
    existingFields: any[],
    conflicts: ICompatibilityConflict[]
  ): void {
    const fields = schema.SiteFields ?? []
    if (fields.length === 0) return
    const byName = new Map(existingFields.map((f) => [(f.InternalName ?? '').toLowerCase(), f]))
    const byId = new Map(existingFields.map((f) => [normGuid(f.Id), f]))

    for (const xml of fields) {
      const text = String(xml)
      const id = attr(text, 'ID')
      const name = attr(text, 'Name') || attr(text, 'StaticName')
      if (!name) continue
      const exByName = byName.get(name.toLowerCase())

      if (exByName) {
        const type = declaredType(text)
        const change = typeChange(exByName.TypeAsString, type)
        if (change === 'other') {
          // The whole column is left as it is, its id included.
          conflicts.push({
            kind: 'siteField',
            targetId: id ?? name,
            targetName: name,
            existingName: exByName.TypeAsString,
            resolution: 'skip',
            detail: format(strings.CatalogConflictSiteFieldType, name, exByName.TypeAsString, type)
          })
          continue
        }
        if (id && normGuid(exByName.Id) !== normGuid(id)) {
          conflicts.push({
            kind: 'siteField',
            targetId: id,
            targetName: name,
            existingName: name,
            resolution: 'overwrite',
            detail: format(strings.CatalogConflictSiteField, name)
          })
        }
        if (change === 'widening') {
          conflicts.push({
            kind: 'siteField',
            targetId: id ?? name,
            targetName: name,
            existingName: exByName.TypeAsString,
            resolution: 'overwrite',
            detail: format(
              strings.CatalogConflictSiteFieldWidened,
              name,
              exByName.TypeAsString,
              type
            )
          })
        }
        continue
      }
      // Its id under another name: sp-js-provisioning logs an error and does not
      // create the column, but goes on with the rest of the template.
      const exById = id ? byId.get(normGuid(id)) : undefined
      if (exById) {
        conflicts.push({
          kind: 'siteField',
          targetId: id as string,
          targetName: name,
          existingName: exById.InternalName,
          resolution: 'skip',
          detail: format(strings.CatalogConflictSiteFieldReused, name, exById.InternalName)
        })
      }
    }
  }

  private static async _checkLists(
    web: any,
    schema: any,
    conflicts: ICompatibilityConflict[]
  ): Promise<void> {
    const lists = schema.Lists ?? []
    if (lists.length === 0) return
    const existingTitles = new Set<string>(
      (await web.lists.select('Title')()).map((l: any) => (l.Title ?? '').toLowerCase())
    )

    for (const entry of lists) {
      const title: string = entry.Title ?? ''
      const declaredFields = CompatibilityService._listFields(entry)
      const declaredViews: string[] = (entry.Views ?? []).map((v: any) => v?.Title).filter(Boolean)
      const inspects =
        declaredFields.length > 0 || declaredViews.length > 0 || !!entry.RemoveExistingContentTypes
      if (!inspects || !existingTitles.has(title.toLowerCase())) continue

      const list = web.lists.getByTitle(title)
      if (declaredFields.length > 0) {
        const listFields: any[] = await list.fields.select('Id', 'InternalName', 'TypeAsString')()
        CompatibilityService._checkListFields(title, declaredFields, listFields, conflicts)
      }
      if (declaredViews.length > 0) {
        const listViews: any[] = await list.views.select('Title')()
        const viewTitles = new Set(listViews.map((v) => (v.Title ?? '').toLowerCase()))
        for (const vt of declaredViews) {
          if (viewTitles.has(vt.toLowerCase())) {
            conflicts.push({
              kind: 'listView',
              targetId: vt,
              targetName: vt,
              existingName: title,
              resolution: 'overwrite',
              detail: format(strings.CatalogConflictListView, vt, title)
            })
          }
        }
      }
      // sp-js-provisioning removes content types only on a list it creates in the
      // same run; an existing hub list keeps its own.
      if (entry.RemoveExistingContentTypes) {
        conflicts.push({
          kind: 'list',
          targetId: title,
          targetName: title,
          resolution: 'skip',
          detail: format(strings.CatalogConflictList, title)
        })
      }
    }
  }

  /**
   * Compares a list entry's declared `Fields` with the fields of the existing list,
   * as sp-js-provisioning applies them: a field with the declared id is updated in
   * place and never deleted (a widening type change is applied, any other leaves it
   * as it is); a declared field whose name the list has under another id is not
   * added. `FieldRefs` need no check: an existing field only gets the reference's
   * title, `Required` and `Hidden`.
   */
  private static _checkListFields(
    title: string,
    declaredFields: Array<{ id?: string; name?: string; type?: string }>,
    listFields: any[],
    conflicts: ICompatibilityConflict[]
  ): void {
    const byId = new Map(listFields.map((f) => [normGuid(f.Id), f]))
    const byName = new Map(listFields.map((f) => [(f.InternalName ?? '').toLowerCase(), f]))
    for (const df of declaredFields) {
      const name = df.name ?? df.id
      const existing = df.id ? byId.get(normGuid(df.id)) : undefined
      if (!existing) {
        const sameName = df.name ? byName.get(df.name.toLowerCase()) : undefined
        if (sameName) {
          conflicts.push({
            kind: 'listField',
            targetId: df.id ?? df.name,
            targetName: name,
            existingName: title,
            resolution: 'skip',
            detail: format(strings.CatalogConflictListField, name, title)
          })
        }
        continue
      }
      const change = typeChange(existing.TypeAsString, df.type)
      if (change === 'same') continue
      conflicts.push({
        kind: 'listField',
        targetId: df.id,
        targetName: name,
        existingName: title,
        resolution: change === 'widening' ? 'overwrite' : 'skip',
        detail: format(
          change === 'widening'
            ? strings.CatalogConflictListFieldWidened
            : strings.CatalogConflictListFieldType,
          name,
          title,
          existing.TypeAsString,
          df.type
        )
      })
    }
  }

  /** Collect `{ id, name, type }` for a list entry's declared `Fields`. */
  private static _listFields(entry: any): Array<{ id?: string; name?: string; type?: string }> {
    const out: Array<{ id?: string; name?: string; type?: string }> = []
    for (const f of entry.Fields ?? []) {
      if (typeof f === 'string') {
        out.push({ id: attr(f, 'ID'), name: attr(f, 'Name'), type: declaredType(f) })
      } else if (f) {
        out.push({ id: f.ID ?? f.Id, name: f.Name ?? f.InternalName })
      }
    }
    return out.filter((f) => f.id || f.name)
  }

  private static async _checkTaxonomy(
    schema: any,
    conflicts: ICompatibilityConflict[]
  ): Promise<void> {
    try {
      const termStore = getTermStore(SPDataAdapter.sp.web)
      for (const set of schema.Taxonomy?.TermSets ?? []) {
        if (!set?.Id) continue
        try {
          const existing = await termStore.sets.getById(set.Id).select('id', 'localizedNames')()
          const existingName = existing?.localizedNames?.[0]?.name
          if (existingName && set.Name && existingName !== set.Name) {
            conflicts.push({
              kind: 'taxonomy',
              targetId: set.Id,
              targetName: set.Name,
              existingName,
              resolution: 'skip',
              detail: format(strings.CatalogConflictTaxonomy, set.Name, existingName)
            })
          }
        } catch {
          // A failed read cannot establish a conflict; provisioning still attempts the term set.
        }
      }
    } catch {
      // The compatibility scan is best-effort when the Term Store cannot be queried.
    }
  }

  private static async _checkExtensions(
    manifest: IPackageManifest,
    conflicts: ICompatibilityConflict[]
  ): Promise<void> {
    const extensions = manifest.provisioning?.extensions ?? []
    if (extensions.length === 0) return
    const installed = await ProjectExtensionsService.getInstalledFiles()
    const byName = new Map(installed.map((f) => [f.fileName.toLowerCase(), f]))

    for (const ext of extensions) {
      const fileName = (ext.file.split('/').pop() ?? '').toLowerCase()
      const hit = byName.get(fileName)
      if (!hit) continue
      // Re-importing this package's own extension is an expected update, not a conflict.
      if (hit.stamp?.id && hit.stamp.id.toLowerCase() === manifest.id.toLowerCase()) continue
      conflicts.push({
        kind: 'extension',
        targetId: fileName,
        targetName: ext.name,
        existingName: hit.stamp?.id,
        resolution: 'overwrite',
        detail: format(strings.CatalogConflictExtension, ext.name)
      })
    }
  }

  /**
   * Returns the schema with the conflicting entries that sp-js-provisioning would
   * otherwise apply, or fail on, removed for the resolutions the user accepted
   * (`skip`/`blocked`): whole ContentTypes entries (an id owned by another content
   * type, or a field reference the hub lacks) and term sets out of
   * `Taxonomy.TermSets` (so an existing term set with the same id but a different
   * name really is left untouched, as the conflict dialog promises). Site columns
   * and list fields stay in: sp-js-provisioning 1.5.1 updates them in place, leaves
   * a type change that would lose values alone and logs a column it cannot create
   * as an error, without stopping. Mutates a shallow clone so the existing hub
   * objects are left untouched on provisioning.
   */
  public static stripConflicts(schema: any, report: ICompatibilityReport): any {
    if (!schema || !report?.conflicts?.length) return schema
    const next = { ...schema }
    const termSetSkipIds = new Set(
      report.conflicts.filter((c) => c.kind === 'taxonomy').map((c) => normGuid(c.targetId))
    )
    if (next.Taxonomy?.TermSets && termSetSkipIds.size > 0) {
      const termSets = next.Taxonomy.TermSets.filter(
        (set: any) => !termSetSkipIds.has(normGuid(set?.Id))
      )
      if (termSets.length > 0) {
        next.Taxonomy = { ...next.Taxonomy, TermSets: termSets }
      } else {
        delete next.Taxonomy
      }
    }
    const ctSkip = new Set(
      report.conflicts.filter((c) => c.kind === 'contentType').map((c) => normCtId(c.targetId))
    )
    const ctFieldRefBlocked = new Set(
      report.conflicts.filter((c) => c.kind === 'fieldRef').map((c) => c.targetName.toLowerCase())
    )
    if (Array.isArray(next.ContentTypes)) {
      next.ContentTypes = next.ContentTypes.filter(
        (ct: any) =>
          !ctSkip.has(normCtId(ct.ID)) && !ctFieldRefBlocked.has((ct.Name ?? '').toLowerCase())
      )
    }
    return next
  }
}
