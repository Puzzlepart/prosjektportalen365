import * as fs from 'fs'
import * as path from 'path'
import { spfxTestContext } from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'

/**
 * The program web parts' tests build each web part as SPFx does: an instance with its context,
 * properties, element and display mode set, then `onInit`. The data adapter is mocked in each test
 * file; this is the rest of what the web parts read.
 */

export const SITE = 'https://contoso.sharepoint.com/sites/program'

/**
 * The alias in a web part's manifest, read from `src` (the compiled tests run in
 * `lib-commonjs/webparts`). Usage statistics count a web part by it: a test that expects a count
 * under this name also proves that the web part counts by its manifest's alias.
 *
 * @param folder The web part's folder under `src/webparts`
 */
export function manifestAlias(folder: string): string {
  const file = path.resolve(__dirname, '../../src/webparts', folder, 'manifest.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')).alias
}

/** The SPFx context of a web part on the program site, with the calls it makes recorded. */
export function webPartContext() {
  return {
    pageContext: {
      site: { id: { toString: () => 'site-1' } },
      web: { absoluteUrl: SITE },
      listItem: { id: 3 }
    },
    manifest: { id: 'manifest-1' },
    instanceId: 'instance-1',
    propertyPane: { refresh: jest.fn() },
    spHttpClient: { post: jest.fn(() => Promise.resolve({ ok: true })) }
  }
}

/**
 * The context of a web part whose usage is counted: `webPartContext` with the parts usage
 * statistics read (the shared library's `spfxTestContext`), which are a site and a hub with real
 * ids, the tenant, and the web part's alias and version in its manifest. On `webPartContext`
 * alone nothing is counted.
 *
 * @param alias The web part's alias in its manifest
 * @param page Which site the page is on: a site of the hub, as a program is (the default), or
 * the hub itself
 */
export function telemetryContext(alias: string, page: 'hub' | 'project' = 'project') {
  const context = webPartContext()
  const counted = spfxTestContext({ page, alias })
  return {
    ...context,
    pageContext: { ...context.pageContext, ...counted.pageContext },
    manifest: { ...context.manifest, ...counted.manifest }
  }
}

/**
 * Creates the web part with `properties` in `displayMode` (1 is read, 2 is edit) on a new element
 * of the page, and initialises it.
 *
 * @param WebPart The web part's class
 * @param properties The web part's properties
 * @param displayMode 1 is read, 2 is edit
 * @param context The web part's context, when it is not `webPartContext`
 */
export async function initWebPart(
  WebPart: new () => { onInit(): Promise<void> },
  properties: Record<string, any> = {},
  displayMode = 1,
  context: Record<string, any> = webPartContext()
  // SPFx types `domElement` and `properties` as protected; the tests read them as SharePoint would.
): Promise<any> {
  const webPart: any = new WebPart()
  webPart.context = context
  webPart.properties = { title: 'Underområder', ...properties }
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webPart.displayMode = displayMode
  await webPart.onInit()
  return webPart
}

/** The fields of the web part's property pane, by their target property. */
export function propertyPaneFields(webPart: { getPropertyPaneConfiguration(): any }) {
  const fields: Record<string, any> = {}
  for (const page of webPart.getPropertyPaneConfiguration().pages) {
    for (const group of page.groups) {
      for (const field of group.groupFields) fields[field.targetProperty] = field.properties
    }
  }
  return fields
}
