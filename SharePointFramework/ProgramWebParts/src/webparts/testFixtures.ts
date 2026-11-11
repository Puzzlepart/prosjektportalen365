/**
 * The program web parts' tests build each web part as SPFx does: an instance with its context,
 * properties, element and display mode set, then `onInit`. The data adapter is mocked in each test
 * file; this is the rest of what the web parts read.
 */

export const SITE = 'https://contoso.sharepoint.com/sites/program'

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
 * Creates the web part with `properties` in `displayMode` (1 is read, 2 is edit) on a new element
 * of the page, and initialises it.
 */
export async function initWebPart(
  WebPart: new () => { onInit(): Promise<void> },
  properties: Record<string, any> = {},
  displayMode = 1
  // SPFx types `domElement` and `properties` as protected; the tests read them as SharePoint would.
): Promise<any> {
  const webPart: any = new WebPart()
  webPart.context = webPartContext()
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
