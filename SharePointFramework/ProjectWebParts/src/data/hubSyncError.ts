import strings from 'ProjectWebPartsStrings'
import { format, isUnauthorizedError } from 'pp365-shared-library'
import resource from 'SharedResources'

/**
 * Why a write to the hub failed, for a warning to the user: the missing write access to the
 * hub's project list in words, otherwise the error's own message.
 *
 * @param error Error from the hub
 */
export function getHubSyncErrorReason(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return format(strings.HubSyncNoWriteAccessReason, resource.Lists_Projects_Title)
  }
  return (error as Error)?.message ?? String(error)
}
