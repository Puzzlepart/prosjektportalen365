import { format } from '@fluentui/react/lib/Utilities'
import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/fields'
import '@pnp/sp/content-types'
import '@pnp/sp/views'
import '@pnp/sp/files'
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
 * Pre-import compatibility check (Mode A): compares a package's
 * `hub-template.json` (and its bundled extensions) against what already exists
 * on the hub web, and reports conflicts so the admin can fix them manually or
 * continue knowing items will be overwritten or skipped.
 *
 * Read-only — never mutates the hub. Resolution semantics: see
 * {@link ICompatibilityReport}.
 */
export class CompatibilityService {
  public static async check(
    zip: any,
    manifest: IPackageManifest,
    featureFlagProvisioning?: boolean
  ): Promise<ICompatibilityReport> {
    const conflicts: ICompatibilityConflict[] = []
    try {
      const schema = await CompatibilityService._readHubSchema(zip, manifest)
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
      await CompatibilityService._checkExtensions(manifest, conflicts)
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
      const type = attr(text, 'Type')
      if (!name) continue
      const exByName = byName.get(name.toLowerCase())
      const exById = id ? byId.get(normGuid(id)) : undefined

      if (exByName && id && normGuid(exByName.Id) !== normGuid(id)) {
        conflicts.push({
          kind: 'siteField',
          targetId: id,
          targetName: name,
          existingName: name,
          resolution: 'overwrite',
          detail: format(strings.CatalogConflictSiteField, name)
        })
      } else if (exByName && type && exByName.TypeAsString && exByName.TypeAsString !== type) {
        conflicts.push({
          kind: 'siteField',
          targetId: id ?? name,
          targetName: name,
          existingName: exByName.TypeAsString,
          resolution: 'overwrite',
          detail: format(strings.CatalogConflictSiteFieldType, name, exByName.TypeAsString)
        })
      }
      if (exById && (exById.InternalName ?? '').toLowerCase() !== name.toLowerCase()) {
        conflicts.push({
          kind: 'siteField',
          targetId: id as string,
          targetName: name,
          existingName: exById.InternalName,
          resolution: 'blocked',
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
      const declaredFields = CompatibilityService._listFieldIds(entry)
      const declaredViews: string[] = (entry.Views ?? []).map((v: any) => v?.Title).filter(Boolean)
      const inspects =
        declaredFields.length > 0 || declaredViews.length > 0 || !!entry.RemoveExistingContentTypes
      if (!inspects || !existingTitles.has(title.toLowerCase())) continue

      const list = web.lists.getByTitle(title)
      if (declaredFields.length > 0) {
        const listFields: any[] = await list.fields.select('Id', 'InternalName')()
        const listFieldIds = new Set(listFields.map((f) => normGuid(f.Id)))
        for (const df of declaredFields) {
          if (df.id && listFieldIds.has(normGuid(df.id))) {
            conflicts.push({
              kind: 'listField',
              targetId: df.id,
              targetName: df.name ?? df.id,
              existingName: title,
              resolution: 'blocked',
              detail: format(strings.CatalogConflictListField, df.name ?? df.id, title)
            })
          }
        }
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
      if (entry.RemoveExistingContentTypes) {
        conflicts.push({
          kind: 'list',
          targetId: title,
          targetName: title,
          resolution: 'overwrite',
          detail: format(strings.CatalogConflictList, title)
        })
      }
    }
  }

  /** Collect `{ id, name }` for a list entry's declared Fields + FieldRefs. */
  private static _listFieldIds(entry: any): Array<{ id?: string; name?: string }> {
    const out: Array<{ id?: string; name?: string }> = []
    for (const f of entry.Fields ?? []) {
      if (typeof f === 'string') out.push({ id: attr(f, 'ID'), name: attr(f, 'Name') })
      else if (f) out.push({ id: f.ID ?? f.Id, name: f.Name ?? f.InternalName })
    }
    for (const ref of entry.FieldRefs ?? []) {
      if (ref) out.push({ id: ref.ID ?? ref.Id, name: ref.Name })
    }
    return out.filter((f) => f.id)
  }

  private static async _checkTaxonomy(
    schema: any,
    conflicts: ICompatibilityConflict[]
  ): Promise<void> {
    try {
      const sp: any = SPDataAdapter.sp
      const group = schema.Taxonomy?.TermGroup
      for (const set of schema.Taxonomy?.TermSets ?? []) {
        if (!set?.Id) continue
        try {
          const existing: any = await sp.termStore.sets
            .getById(set.Id)
            .select('id', 'localizedNames')()
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
          // Term set not found (will be created) — no conflict.
        }
      }
      void group
    } catch {
      // No term store permission — taxonomy is feature-flag-gated anyway.
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
   * Returns the schema with conflicting entries removed for the resolutions the
   * user accepted (`skip`/`blocked`): whole ContentTypes / SiteFields entries,
   * and individual fields out of a `Lists[].Fields`/`FieldRefs` array. Mutates a
   * shallow clone so the existing hub objects are left untouched on provisioning.
   */
  public static stripConflicts(schema: any, report: ICompatibilityReport): any {
    if (!schema || !report?.conflicts?.length) return schema
    const next = { ...schema }
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
    const fieldSkipIds = new Set(
      report.conflicts
        .filter((c) => c.kind === 'siteField' && c.resolution === 'blocked')
        .map((c) => normGuid(c.targetId))
    )
    if (Array.isArray(next.SiteFields)) {
      next.SiteFields = next.SiteFields.filter(
        (xml: any) => !fieldSkipIds.has(normGuid(attr(String(xml), 'ID')))
      )
    }
    const listFieldSkipIds = new Set(
      report.conflicts.filter((c) => c.kind === 'listField').map((c) => normGuid(c.targetId))
    )
    if (Array.isArray(next.Lists) && listFieldSkipIds.size > 0) {
      next.Lists = next.Lists.map((entry: any) => {
        const e = { ...entry }
        if (Array.isArray(e.Fields)) {
          e.Fields = e.Fields.filter((f: any) => {
            const id = typeof f === 'string' ? attr(f, 'ID') : f?.ID ?? f?.Id
            return !listFieldSkipIds.has(normGuid(id))
          })
        }
        if (Array.isArray(e.FieldRefs)) {
          e.FieldRefs = e.FieldRefs.filter(
            (r: any) => !listFieldSkipIds.has(normGuid(r?.ID ?? r?.Id))
          )
        }
        return e
      })
    }
    return next
  }
}
