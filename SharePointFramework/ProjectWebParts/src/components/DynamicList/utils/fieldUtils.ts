/**
 * SharePoint views store certain fields under alias names (e.g. "LinkTitle" instead of "Title").
 * This map normalizes those aliases to the actual field InternalName so that view field lookups
 * match correctly against list field definitions.
 */
const VIEW_FIELD_ALIASES: Record<string, string> = {
  LinkTitle: 'Title',
  LinkTitleNoMenu: 'Title',
  LinkFilename: 'FileLeafRef',
  LinkFilenameNoMenu: 'FileLeafRef',
  DocIcon: 'File_x0020_Type'
}

/**
 * Normalizes an array of view field names by replacing known SP aliases
 * (e.g. LinkTitle → Title) with the actual field InternalName.
 *
 * @param viewFieldNames - Raw field names from view.ViewFields.Items
 * @returns Normalized field names that match field.InternalName
 */
export function normalizeViewFieldNames(viewFieldNames: string[]): string[] {
  return viewFieldNames.map((name) => VIEW_FIELD_ALIASES[name] || name)
}

/**
 * Determines whether a SharePoint field should be available for DynamicList column rendering.
 * Used by both the web part property pane (column options) and runtime data fetching.
 *
 * @param field - SharePoint field metadata
 * @param projectContentColumns - Configuration columns from the hub site
 * @returns Whether the field should be visible in DynamicList
 */
export function isVisibleListField(
  field: any,
  projectContentColumns: Array<{ internalName?: string; fieldName?: string }>
): boolean {
  const showInEditForm = field.ShowInEditForm ?? true
  const hidden = field.Hidden ?? false
  const readOnlyField = field.SchemaXml ? field.SchemaXml.indexOf('ReadOnly="TRUE"') !== -1 : false

  const isInProjectContentColumns = projectContentColumns.some(
    (c) => c.internalName === field.InternalName || c.fieldName === field.InternalName
  )

  return (
    showInEditForm &&
    !hidden &&
    (!readOnlyField || isInProjectContentColumns) &&
    !field.InternalName.startsWith('_') &&
    field.InternalName !== 'Attachments'
  )
}
