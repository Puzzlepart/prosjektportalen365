import type { SpEntityPortalService } from 'pp365-shared-library'

/**
 * Write a phase change to the project's entity in the hub. A project without an entity, set up
 * by a user without write access to the hub, is registered by `registerProject` first, as saving
 * its properties would register it.
 *
 * @param entityService Entity service for the hub's project list
 * @param siteId ID of the project's site, which identifies its entity
 * @param phaseProperties The phase properties written to the project's properties item
 * @param registerProject Adds the project's entity in the hub with all its properties
 */
export async function syncPhaseToHub(
  entityService: Pick<SpEntityPortalService, 'getEntityItem' | 'updateEntityItem'>,
  siteId: string,
  phaseProperties: Record<string, string>,
  registerProject: () => Promise<void>
): Promise<void> {
  const entity = await entityService.getEntityItem(siteId)
  if (!entity) await registerProject()
  await entityService.updateEntityItem(siteId, phaseProperties)
}
