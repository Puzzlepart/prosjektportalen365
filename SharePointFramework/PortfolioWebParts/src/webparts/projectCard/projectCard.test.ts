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
/** What the portal data service knows of the hub in a test: its `url`, and `isAvailable`. */
let portal: { url?: string; isAvailable?: boolean } = {}
jest.mock('../../data', () => ({
  __esModule: true,
  ...jest.requireActual('../../data'),
  DataAdapter: jest.fn(() => ({ configure: () => Promise.resolve({}) }))
}))
jest.mock('pp365-shared-library', () => ({
  __esModule: true,
  ...jest.requireActual('pp365-shared-library'),
  PortalDataService: jest.fn(() => ({
    configure: () =>
      Promise.resolve({ getProjectColumns: () => Promise.resolve(COLUMNS), ...portal })
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

import { ProjectCard } from 'components/ProjectCard'
import ProjectCardWebPart from '.'

/** A page of the hub, as the tests of the property pane have it. */
const HUB_PAGE = {
  web: { absoluteUrl: HUB, serverRelativeUrl: '/sites/pp365', title: 'Portefølje' },
  site: { id: { toString: () => 'site-1' } },
  legacyPageContext: { isSiteAdmin: true }
}

/** A page of a site with the id `siteId`, in the hub with the id `hub-1`. */
function pageOfSite(siteId: string) {
  return {
    web: { absoluteUrl: `https://contoso.sharepoint.com/sites/${siteId}`, title: siteId },
    site: { id: { toString: () => siteId } },
    legacyPageContext: { isSiteAdmin: true, siteId: `{${siteId}}`, hubSiteId: 'hub-1' }
  }
}

/** The web part on a page (of the hub unless given), with the page's properties, initialised. */
async function projectCardWebPart(properties: Record<string, any>, pageContext: any = HUB_PAGE) {
  const webPart: any = new ProjectCardWebPart()
  webPart.context = {
    pageContext,
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    propertyPane: { refresh: jest.fn() }
  }
  webPart.properties = properties
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webPart.displayMode = 2
  await webPart.onInit()
  return webPart
}

/** The props the web part renders the card with. */
function cardProps(webPart: any) {
  webPart.renderComponent = jest.fn()
  webPart.render()
  expect(webPart.renderComponent).toHaveBeenCalledWith(ProjectCard, expect.anything())
  return webPart.renderComponent.mock.calls[0][1]
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

describe('ProjectCardWebPart', () => {
  afterEach(() => {
    portal = {}
  })

  it('shows the fields the card shows when added from the toolbox', async () => {
    // The manifest adds it with the text fields the card reads, which no option, keyed by the
    // columns' internal names, matched: «Primært felt» and «Sekundært felt» showed empty.
    const fields = propertyPaneFields(
      await projectCardWebPart({
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

  it("shows the card's own fields when the page gave it none", async () => {
    // As the project news page template adds it.
    const fields = propertyPaneFields(await projectCardWebPart({ showProjectLogo: true }))
    expect(shown(fields.primaryField)).toBe('Tjenesteområde')
    expect(shown(fields.secondaryField)).toBe('Prosjekttype')
  })

  it('shows a field chosen in the pane, and none for a field the hub has no column for', async () => {
    const fields = propertyPaneFields(
      await projectCardWebPart({
        primaryField: 'GtProjectPhase',
        secondaryField: 'GtProjectNumber'
      })
    )
    expect(shown(fields.primaryField)).toBe('Fase')
    expect(fields.secondaryField.selectedKey).toBe('GtProjectNumber')
    expect(shown(fields.secondaryField)).toBeUndefined()
  })

  it('reads the project from the hub on a project site, and shows the project the page is on', async () => {
    // `Prosjekter` and `Maloppsett` are lists of the hub: the card asked the project site for
    // them, and showed «Prosjektet kunne ikke hentes».
    portal = { url: HUB, isAvailable: true }
    const props = cardProps(await projectCardWebPart({}, pageOfSite('project-1')))
    expect(props.hubContext).toEqual(
      expect.objectContaining({ hubSiteId: 'hub-1', hubSiteUrl: HUB })
    )
    expect(props.projectSiteId).toBe('project-1')

    // A site named in the pane is still the one shown.
    const named = await projectCardWebPart({ projectSiteId: 'project-2' }, pageOfSite('project-1'))
    expect(cardProps(named).projectSiteId).toBe('project-2')
  })

  it('reads the lists of the site the page is on when that is the hub, or the hub is out of reach', async () => {
    portal = { url: HUB, isAvailable: true }
    const onHub = cardProps(
      await projectCardWebPart({ projectSiteId: 'project-2' }, pageOfSite('hub-1'))
    )
    expect(onHub.hubContext).toBeUndefined()
    expect(onHub.projectSiteId).toBe('project-2')
    // The hub is no project: with no site named, the card has none to show.
    expect(
      cardProps(await projectCardWebPart({}, pageOfSite('hub-1'))).projectSiteId
    ).toBeUndefined()

    portal = { url: HUB, isAvailable: false }
    const outOfReach = cardProps(await projectCardWebPart({}, pageOfSite('project-1')))
    expect(outOfReach.hubContext).toBeUndefined()
    expect(outOfReach.projectSiteId).toBeUndefined()
  })
})
