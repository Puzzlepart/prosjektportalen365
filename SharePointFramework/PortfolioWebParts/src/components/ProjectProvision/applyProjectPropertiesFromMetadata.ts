import { Web } from '@pnp/sp/presets/all'
import resource from 'SharedResources'
import { IPortfolioWebPartsDataAdapter } from '../../data/types'

const INFRASTRUCTURE_KEYS = new Set(['Title', 'GtSiteUrl', 'GtParentProjects'])

export type IProjectPropertyEntry = {
  internalName: string
  displayName?: string
  value: any
}

export type ITaxonomyUpdate = { FieldName: string; FieldValue: string }

export type IApplyProjectPropertiesResult = {
  properties: Record<string, any>
  taxonomyUpdates: ITaxonomyUpdate[]
}

type IDefaultMetadataShape = {
  contentType?: string
  contentTypeId?: string
  projectProperties?: IProjectPropertyEntry[]
}

type IFieldSchema = {
  InternalName: string
  TypeAsString: string
}

type IContentTypeSchema = {
  StringId?: string
  Name?: string
}

const safeParse = (metadataJson: string): IDefaultMetadataShape | null => {
  if (!metadataJson || typeof metadataJson !== 'string') return null
  try {
    return JSON.parse(metadataJson)
  } catch (error) {
    console.warn('Failed to parse DefaultMetadata JSON:', error)
    return null
  }
}

/**
 * Returns the value formatted for `validateUpdateListItem` against a
 * TaxonomyFieldType / TaxonomyFieldTypeMulti column. SharePoint requires
 * `Label|TermGuid` (joined by `;` for multi); a label without a GUID will
 * be rejected with a "not properly formatted" error, so admins must put
 * the term GUID in the JSON value.
 *
 * Accepted input shapes per term:
 *   - "Label|guid"
 *   - { label, termGuid } / { Label, TermGuid }
 *   - arrays of the above (multi-tax)
 */
const formatTaxonomyValue = (value: any): string | null => {
  if (value == null) return null
  if (Array.isArray(value)) {
    const parts = value.map(formatTaxonomyValue).filter(Boolean) as string[]
    return parts.length > 0 ? parts.join(';') : null
  }
  if (typeof value === 'string') {
    return value.trim() || null
  }
  if (typeof value === 'object') {
    const label = value.label ?? value.Label
    const guid = value.termGuid ?? value.TermGuid
    if (label && guid) return `${label}|${guid}`
    if (label) return String(label)
  }
  return null
}

/**
 * Resolves a list-level ContentTypeId from the metadata's `contentTypeId`
 * (exact match, then prefix match against parent CT ids) or `contentType`
 * (matched by name). Returns the resolved StringId, or undefined.
 */
const resolveContentTypeId = async (
  list: any,
  parsed: IDefaultMetadataShape
): Promise<string | undefined> => {
  const explicitId = parsed.contentTypeId?.trim()
  const explicitName = parsed.contentType?.trim()
  if (!explicitId && !explicitName) return undefined

  let contentTypes: IContentTypeSchema[]
  try {
    contentTypes = await list.contentTypes.select('Name', 'StringId')()
  } catch (error) {
    console.warn('Failed to load ProjectData content types:', error)
    return undefined
  }

  if (explicitId) {
    const match =
      contentTypes.find((ct) => ct.StringId === explicitId) ??
      contentTypes.find((ct) => ct.StringId?.startsWith(explicitId))
    if (match?.StringId) return match.StringId
    console.warn(`No ProjectData content type matches id '${explicitId}'`)
  }

  if (explicitName) {
    const match = contentTypes.find((ct) => ct.Name === explicitName)
    if (match?.StringId) return match.StringId
    console.warn(`No ProjectData content type matches name '${explicitName}'`)
  }

  return undefined
}

/**
 * Returns the projectProperties to display in the level-2 preview, with
 * infrastructure keys (Title / GtSiteUrl / GtParentProjects) filtered out.
 * Safe on malformed / empty input — always returns an array.
 */
export const parseMetadataPreview = (metadataJson: string): IProjectPropertyEntry[] => {
  const entries = safeParse(metadataJson)?.projectProperties ?? []
  return entries.filter(
    (e) => e && typeof e.internalName === 'string' && !INFRASTRUCTURE_KEYS.has(e.internalName)
  )
}

/**
 * Reads the type's `DefaultMetadata` JSON, merges non-taxonomy projectProperties
 * into the given `properties` (ready for `list.items.add`), and returns taxonomy
 * entries separately as `{ FieldName, FieldValue }` pairs to be applied with
 * `validateUpdateListItem` after the item is created — taxonomy can't be set
 * via plain `items.add` in REST.
 *
 * Lookup / LookupMulti are skipped by design.
 */
export const applyProjectPropertiesFromMetadata = async (
  properties: Record<string, any>,
  metadataJson: string,
  hubUrl: string,
  dataAdapter: IPortfolioWebPartsDataAdapter
): Promise<IApplyProjectPropertiesResult> => {
  const taxonomyUpdates: ITaxonomyUpdate[] = []
  const parsed = safeParse(metadataJson)
  const entries = parsed?.projectProperties ?? []
  const wantsContentType = !!(parsed?.contentTypeId || parsed?.contentType)
  if (entries.length === 0 && !wantsContentType) return { properties, taxonomyUpdates }
  if (!dataAdapter?.sp?.web) return { properties, taxonomyUpdates }

  const list = Web([dataAdapter.sp.web, hubUrl]).lists.getByTitle(
    resource.Lists_ProjectData_Title
  )

  if (wantsContentType) {
    const contentTypeId = await resolveContentTypeId(list, parsed)
    if (contentTypeId) properties.ContentTypeId = contentTypeId
  }

  if (entries.length === 0) return { properties, taxonomyUpdates }

  let fields: IFieldSchema[]
  try {
    fields = await list.fields.select('InternalName', 'TypeAsString')()
  } catch (error) {
    console.warn('Failed to load ProjectData field schemas:', error)
    return { properties, taxonomyUpdates }
  }
  const fieldByInternalName = new Map(fields.map((f) => [f.InternalName, f]))

  for (const { internalName, value } of entries) {
    if (!internalName || INFRASTRUCTURE_KEYS.has(internalName)) continue

    const field = fieldByInternalName.get(internalName)
    if (!field) {
      console.warn(`ProjectData has no field named '${internalName}', skipping`)
      continue
    }

    try {
      switch (field.TypeAsString) {
        case 'Lookup':
        case 'LookupMulti':
          break
        case 'TaxonomyFieldType':
        case 'TaxonomyFieldTypeMulti': {
          const formatted = formatTaxonomyValue(value)
          if (formatted) taxonomyUpdates.push({ FieldName: internalName, FieldValue: formatted })
          break
        }
        case 'User':
        case 'UserMulti': {
          const ids = await ensureUserIds(Web([dataAdapter.sp.web, hubUrl]), value)
          if (ids.length === 0) break
          properties[`${internalName}Id`] =
            field.TypeAsString === 'UserMulti' ? ids : ids[0]
          break
        }
        case 'URL':
          properties[internalName] = formatUrlValue(value)
          break
        default:
          properties[internalName] = value
      }
    } catch (error) {
      console.warn(`Failed to apply project property '${internalName}':`, error)
    }
  }

  return { properties, taxonomyUpdates }
}

const ensureUserIds = async (web: any, value: any): Promise<number[]> => {
  const list = Array.isArray(value) ? value : value != null ? [value] : []
  const ids: number[] = []
  for (const v of list) {
    const login = typeof v === 'string' ? v : v?.email || v?.loginName
    if (!login) continue
    const ensured = await web.ensureUser(login)
    ids.push(ensured.data.Id)
  }
  return ids
}

const formatUrlValue = (value: any): { Url: string; Description: string } | undefined => {
  if (typeof value === 'string' && value) return { Url: value, Description: value }
  const url = value?.url ?? value?.Url
  if (!url) return undefined
  return { Url: url, Description: value.description ?? value.Description ?? url }
}

/**
 * Applies the taxonomy updates collected by `applyProjectPropertiesFromMetadata`
 * to a freshly-added ProjectData item via `validateUpdateListItem` (the supported
 * REST path for taxonomy fields).
 *
 * `FieldValue` must be `Label|TermGuid` (or `Label1|guid1;Label2|guid2` for multi).
 */
export const applyTaxonomyUpdatesAfterAdd = async (
  itemId: number,
  hubUrl: string,
  updates: ITaxonomyUpdate[],
  dataAdapter: IPortfolioWebPartsDataAdapter
): Promise<void> => {
  if (!updates.length || !itemId || !dataAdapter?.sp?.web) return

  try {
    const result = await Web([dataAdapter.sp.web, hubUrl])
      .lists.getByTitle(resource.Lists_ProjectData_Title)
      .items.getById(itemId)
      .validateUpdateListItem(updates)

    for (const row of result ?? []) {
      if (row?.HasException) {
        console.warn(`validateUpdateListItem failed for '${row.FieldName}': ${row.ErrorMessage}`)
      }
    }
  } catch (error) {
    console.warn('Failed to apply taxonomy updates to ProjectData item:', error)
  }
}
