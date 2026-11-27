/**
 * The site column of the project site that a field of the properties list is added from, if the
 * site has one. A site column hidden from the edit form is passed over, and the field is made on
 * the list from the hub's schema, as it always was. When every field is to come from a site
 * column (`fromSiteColumns`), such a site column is used too.
 *
 * @param siteFields The project site's site columns
 * @param internalName Internal name of the field
 * @param fromSiteColumns Whether every field is to come from a site column
 */
export function findSiteColumn<T extends { InternalName?: string; SchemaXml?: string }>(
  siteFields: T[],
  internalName: string,
  fromSiteColumns: boolean
): T | undefined {
  return (siteFields ?? []).find(
    (field) =>
      field.InternalName === internalName &&
      (fromSiteColumns || `${field.SchemaXml ?? ''}`.indexOf('ShowInEditForm="FALSE"') === -1)
  )
}

/**
 * How the list for a project's properties is kept when it is synchronized with the hub's project
 * content type (`PortalDataService.syncList`).
 *
 * The list is hidden, with the default content type of its template: the portfolio shows the
 * project's entry in the hub. A shielded project has no entry there. The portfolio finds its
 * properties item by search, under the project content type the setup gave the item, and search
 * leaves the items of a hidden list out: the list stays visible, with its content types.
 *
 * @param isShieldedProject Whether the project is shielded, or might be (`isShieldedProject`)
 */
export function getProjectPropertiesListSettings(isShieldedProject: boolean): {
  enableContentTypes: boolean
  settings: { Hidden: boolean; EnableAttachments: boolean; EnableVersioning: boolean }
} {
  return {
    enableContentTypes: isShieldedProject,
    settings: { Hidden: !isShieldedProject, EnableAttachments: false, EnableVersioning: true }
  }
}
