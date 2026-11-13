import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService'
import {
  attachTelemetryPortal,
  ITelemetryPortal,
  registerSiteTypeResolver,
  startTelemetry,
  telemetryInitFromContext,
  TelemetryResolvedSiteType
} from 'pp365-shared-library/lib/telemetry'

/** The hub's data service as a command set hands it to usage statistics: `PortalDataService` fits. */
export interface ICommandSetTelemetryPortal extends ITelemetryPortal {
  getSiteKind(siteId: string): Promise<TelemetryResolvedSiteType>
}

/**
 * Starts usage statistics for a list view command set, once it has the hub's data service: the
 * page it is on, the service (without settings: a command set reads none, so the gate reads them
 * through the service's cached `getGlobalSettings`) and how to tell what kind of site this is,
 * which a page on the hub itself never asks. The command set is set up by now, and usage
 * statistics must not undo that: whatever goes wrong here is dropped.
 *
 * @param context The command set's context
 * @param portal The hub's data service
 */
export function startCommandSetTelemetry(
  context: ListViewCommandSetContext,
  portal: ICommandSetTelemetryPortal
): void {
  try {
    const siteId = context.pageContext.site.id.toString()
    startTelemetry(telemetryInitFromContext(context, { isDebug: DEBUG }))
    attachTelemetryPortal(portal)
    registerSiteTypeResolver(siteId, () => portal.getSiteKind(siteId))
  } catch {
    // Usage statistics never break the command set.
  }
}

/**
 * Starts usage statistics for a command set that has no hub data service of its own: one is made
 * for it first. Call it without waiting (`void`), so the command set starts no later than before;
 * it never rejects. On the hub, where the idea lists are, making the service costs no request once
 * the browser has looked the hub up: its URL is cached from then on, and access to the hub is only
 * probed from another site.
 *
 * @param context The command set's context
 */
export async function startCommandSetTelemetryWithOwnPortal(
  context: ListViewCommandSetContext
): Promise<void> {
  try {
    const portal = await new PortalDataService().configure({ spfxContext: context })
    startCommandSetTelemetry(context, portal)
  } catch {
    // Usage statistics never break the command set.
  }
}
