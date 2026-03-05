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
  const readOnlyField = field.SchemaXml
    ? field.SchemaXml.indexOf('ReadOnly="TRUE"') !== -1
    : false

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
