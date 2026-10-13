// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The harness maps every `@pnp/*` path to one stub file, so this
// mock also stands for `@pnp/core`: `AssignFrom` names the web it copies from, and a client keeps
// the URL and the behaviour it was built with.
jest.mock('@pnp/sp', () => ({
  AssignFrom: jest.fn((web: unknown) => ({ assignedFrom: web })),
  spfi: jest.fn((url: string) => ({
    using: (behaviour: unknown) => ({
      url,
      behaviour,
      web: {
        lists: { getByTitle: (title: string) => ({ title }) },
        contentTypes: { getById: (id: string) => ({ fields: `fields of ${id}` }) }
      }
    })
  }))
}))
jest.mock('../../data/createSpfiInstance', () => ({
  createSpfiInstance: jest.fn((context: any) => ({ web: `the web of ${context.name}` }))
}))
jest.mock('./operations', () => ({ fetchEntity: jest.fn(() => Promise.resolve({})) }))

import { createSpfiInstance } from '../../data/createSpfiInstance'
import { fetchEntity } from './operations'
import { SpEntityPortalService } from './SpEntityPortalService'

/**
 * The entity service's wiring: its client reaches the portal the way the library's other clients
 * connect (`createSpfiInstance`, so a factory the integration tests register reaches it too), and
 * the entity's URLs start at the page's origin, read from the context rather than from `window`.
 */
describe('SpEntityPortalService', () => {
  const context = {
    name: 'project',
    pageContext: { web: { absoluteUrl: 'https://tenant.sharepoint.com/sites/project' } }
  } as any
  const params = {
    portalUrl: 'https://tenant.sharepoint.com/sites/portfolio',
    listName: 'Prosjekter',
    identityFieldName: 'GtSiteId',
    urlFieldName: 'GtSiteUrl',
    fieldPrefix: 'Gt',
    contentTypeId: '0x0100'
  }

  it("connects to the portal through the library's client for the context", () => {
    const service = new SpEntityPortalService(context, params)
    expect(createSpfiInstance).toHaveBeenCalledWith(context)
    expect(service.sp).toMatchObject({
      url: params.portalUrl,
      behaviour: { assignedFrom: 'the web of project' }
    })
  })

  it("builds the entity's URLs from the page's origin, not from where the code runs", async () => {
    // jsdom's `window.location` is http://localhost, as Node has none at all.
    await new SpEntityPortalService(context, params).fetchEntity('site-id', '/sites/project')
    expect(fetchEntity).toHaveBeenCalledWith(
      { title: 'Prosjekter' },
      'fields of 0x0100',
      expect.objectContaining({ identity: 'site-id', origin: 'https://tenant.sharepoint.com' })
    )
  })
})
