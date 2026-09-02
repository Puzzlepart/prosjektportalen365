import { SPField } from '../models/SPField'

/**
 * Well-known SharePoint base/system field internal names that are typically
 * not meaningful to display in custom field/column pickers. View aliases for
 * the document library file column (`LinkFilename`/`LinkFilenameNoMenu`,
 * `DocIcon`) are included; canonical names like `FileLeafRef` and `FSObjType`
 * are NOT, so consumers that work on document libraries can still surface
 * them. Add list-specific exclusions in the consumer.
 */
export const SP_SYSTEM_FIELD_NAMES = new Set([
  'ContentType',
  'ContentTypeId',
  'MetaInfo',
  'Order',
  'Edit',
  'Type',
  'DocIcon',
  'LinkTitle',
  'LinkTitleNoMenu',
  'LinkFilename',
  'LinkFilenameNoMenu'
])

/**
 * `true` when the field is hidden — covers the boolean `Hidden` flag, the
 * `Hidden="TRUE"` attribute in `SchemaXml`, and the convention of internal
 * SharePoint names starting with `_`.
 */
export function isHiddenSPField(field: SPField): boolean {
  if (!field?.InternalName) return true
  if (field.Hidden) return true
  if (field.SchemaXml && field.SchemaXml.indexOf('Hidden="TRUE"') !== -1) return true
  if (field.InternalName.startsWith('_')) return true
  return false
}

/**
 * `true` when the field is hidden (`isHiddenSPField`) or its internal name
 * is in `SP_SYSTEM_FIELD_NAMES`.
 */
export function isSystemSPField(field: SPField): boolean {
  if (isHiddenSPField(field)) return true
  return SP_SYSTEM_FIELD_NAMES.has(field.InternalName)
}
