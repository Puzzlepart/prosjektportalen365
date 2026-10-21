import { stringIsNullOrEmpty } from '@pnp/core'
import { ItemFieldValues } from 'pp365-shared-library'

/**
 * Fields the project setup sets on the hub entity that the sync does not map, copied from the
 * project's properties item when the sync adds the entity.
 */
export const NEW_ENTITY_TEXT_FIELDS = [
  'GtProjectTemplate',
  'GtInstalledVersion',
  'GtProjectExtensions',
  'GtProjectListContent'
]

/**
 * Properties a hub entity added by the sync gets besides the synced ones and its identity and
 * URL: what the project setup sets when it adds the entity, for a project set up by a user
 * without write access to the hub.
 *
 * @param groupId ID of the project's Microsoft 365 group
 * @param fieldValues Field values of the project's properties item
 * @param projectContentTypeId Content type of the project in the template parameters
 */
export function getNewEntityProperties(
  groupId: string,
  fieldValues: Pick<ItemFieldValues, 'get'>,
  projectContentTypeId?: string
): Record<string, string> {
  const properties: Record<string, string> = {}
  if (!stringIsNullOrEmpty(groupId)) properties.GtGroupId = groupId
  if (!stringIsNullOrEmpty(projectContentTypeId)) properties.ContentTypeId = projectContentTypeId
  for (const fieldName of NEW_ENTITY_TEXT_FIELDS) {
    const value = fieldValues.get<string>(fieldName, { format: 'text' })
    if (!stringIsNullOrEmpty(value)) properties[fieldName] = value
  }
  return properties
}
