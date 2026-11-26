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
