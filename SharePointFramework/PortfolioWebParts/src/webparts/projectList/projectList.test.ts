// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The hub's
// project columns are `COLUMNS`. Every `@pnp/*` import maps to the one PnP stub, so the mock of the
// property controls is all of them in this file: it keeps the stub and only lets the
// `PropertyField*` factories return their field, as SPFx's own factories do, so the pane can be
// read.
;(globalThis as any).DEBUG = false
const HUB = 'https://contoso.sharepoint.com/sites/pp365'
/** The test hub's project columns (`Prosjektkolonner`), as the portal data service gives them. */
const COLUMNS = [
  { internalName: 'Title', name: 'Tittel', dataType: 'text' },
  { internalName: 'GtProjectServiceArea', name: 'Tjenesteområde', dataType: 'tags' },
  { internalName: 'GtProjectType', name: 'Prosjekttype', dataType: 'tags' },
  { internalName: 'GtProjectPhase', name: 'Fase', dataType: 'text' },
  { internalName: 'GtProjectOwner', name: 'Prosjekteier', dataType: 'user' },
  { internalName: 'GtProjectManager', name: 'Prosjektleder', dataType: 'user' }
]
jest.mock('../../data', () => ({
  __esModule: true,
  ...jest.requireActual('../../data'),
  DataAdapter: jest.fn(() => ({ configure: () => Promise.resolve({}) }))
}))
jest.mock('pp365-shared-library', () => ({
  __esModule: true,
  ...jest.requireActual('pp365-shared-library'),
  PortalDataService: jest.fn(() => ({
    configure: () => Promise.resolve({ getProjectColumns: () => Promise.resolve(COLUMNS) })
  }))
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))
jest.mock('@pnp/spfx-property-controls/lib/PropertyFieldDropdownWithCallout', () => {
  const stub = jest.requireActual(
    '@pnp/spfx-property-controls/lib/PropertyFieldDropdownWithCallout'
  )
  return new Proxy(stub, {
    get: (target, prop) =>
      typeof prop === 'string' && prop.startsWith('PropertyField')
        ? (targetProperty: string, properties: any) => ({ targetProperty, properties })
        : target[prop]
  })
})

import ProjectListWebPart from '.'

/** The web part on the hub's front page, with the properties the page gave it, initialised. */
async function projectListWebPart(properties: Record<string, any>) {
  const webPart: any = new ProjectListWebPart()
  webPart.context = {
    pageContext: {
      web: { absoluteUrl: HUB, serverRelativeUrl: '/sites/pp365', title: 'Portefølje' },
      site: { id: { toString: () => 'site-1' } },
      legacyPageContext: { isSiteAdmin: true }
    },
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    propertyPane: { refresh: jest.fn() }
  }
  webPart.properties = properties
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webPart.displayMode = 2
  await webPart.onInit()
  return webPart
}

/** The fields of the web part's property pane, by their target property. */
function propertyPaneFields(webPart: any) {
  const fields: Record<string, any> = {}
  for (const page of webPart.getPropertyPaneConfiguration().pages) {
    for (const group of page.groups) {
      for (const field of group.groupFields) fields[field.targetProperty] = field.properties
    }
  }
  return fields
}

/** The text of the option a dropdown of the pane shows as chosen, `undefined` for none. */
function shown(field: { options: { key: string; text: string }[]; selectedKey: string }) {
  return field.options.find((option) => option.key === field.selectedKey)?.text
}

describe('ProjectListWebPart', () => {
  it('shows the fields the cards show when added from the toolbox', async () => {
    // The manifest adds it with the text fields the cards read, which no option, keyed by the
    // columns' internal names, matched: «Primært felt» and «Sekundært felt» showed empty.
    const fields = propertyPaneFields(
      await projectListWebPart({
        primaryField: 'GtProjectServiceAreaText',
        secondaryField: 'GtProjectTypeText',
        primaryUserField: 'GtProjectOwner',
        secondaryUserField: 'GtProjectManager'
      })
    )
    expect(shown(fields.primaryField)).toBe('Tjenesteområde')
    expect(shown(fields.secondaryField)).toBe('Prosjekttype')
    expect(shown(fields.primaryUserField)).toBe('Prosjekteier')
    expect(shown(fields.secondaryUserField)).toBe('Prosjektleder')
  })

  it("shows the list's own fields when the page gave it none", async () => {
    const fields = propertyPaneFields(await projectListWebPart({ showProjectLogo: true }))
    expect(shown(fields.primaryField)).toBe('Tjenesteområde')
    expect(shown(fields.secondaryField)).toBe('Prosjekttype')
  })

  it('shows a field chosen in the pane, and none for a field the hub has no column for', async () => {
    const fields = propertyPaneFields(
      await projectListWebPart({
        primaryField: 'GtProjectPhase',
        secondaryField: 'GtProjectNumber'
      })
    )
    expect(shown(fields.primaryField)).toBe('Fase')
    expect(fields.secondaryField.selectedKey).toBe('GtProjectNumber')
    expect(shown(fields.secondaryField)).toBeUndefined()
  })
})
