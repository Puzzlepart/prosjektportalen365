/** A child project as the program stores it in `GtChildProjects`. */
export type ChildProject = Record<string, string>

/** What removing child projects from a program needs from the program and from the hubs. */
export interface IChildProjectRemoval {
  /** The program's child projects, as stored on its property item. */
  readChildProjects: () => Promise<ChildProject[]>
  /** Stores the program's child projects on its property item. */
  writeChildProjects: (properties: { GtChildProjects: string }) => Promise<unknown>
  /** Stores the program's child projects in its entry in a hub. */
  updateHub: (properties: { GtChildProjects: string }, hubSiteId: string) => Promise<unknown>
  /** Removes the program from a child project's parents in the child's hub. */
  removeParent: (siteId: string, hubSiteId: string) => Promise<unknown>
}

/**
 * Removes child projects from a program and returns those that remain.
 *
 * The hubs and the child projects' parent links are updated first and the program's own list
 * last, so a hub that cannot be updated leaves the program listing them, as the administration
 * still shows them after the error, and a second try finishes the job. Every step sets the same
 * end state again, so a step that went through before is safe to repeat.
 *
 * @param program The program's and the hubs' operations
 * @param projectsToRemove Child projects to remove
 */
export async function removeChildProjectsFromProgram(
  program: IChildProjectRemoval,
  projectsToRemove: ChildProject[]
): Promise<ChildProject[]> {
  const projects = await program.readChildProjects()
  const remaining = projects.filter(
    (project) => !projectsToRemove.some((removed) => removed.SiteId === project.SiteId)
  )
  const properties = { GtChildProjects: JSON.stringify(remaining) }
  const hubSiteIds = new Set(projectsToRemove.map((project) => project.HubSiteId).filter(Boolean))
  await Promise.all([
    ...Array.from(hubSiteIds).map((hubSiteId) => program.updateHub(properties, hubSiteId)),
    ...projectsToRemove
      .filter((project) => project.HubSiteId)
      .map((project) => program.removeParent(project.SiteId, project.HubSiteId))
  ])
  await program.writeChildProjects(properties)
  return remaining
}
