// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Microsoft Graph answers no groups. Every `@pnp/*` import maps to
// the one PnP stub, so the mock of `@pnp/core` is all of them in this file: it keeps the stub and
// only lets `PnPClientStorage` keep what the card caches in `stored`, as localStorage keeps it
// from one load of the page to the next.
const stored = new Map<string, any>()
jest.mock('msgraph-helper', () => ({
  __esModule: true,
  default: { Get: () => Promise.resolve([]) }
}))
jest.mock('@pnp/core', () => {
  const stub = jest.requireActual('@pnp/core')
  class PnPClientStorage {
    public local = {
      getOrPut: async (key: string, getter: () => Promise<any>) => {
        if (!stored.has(key)) stored.set(key, await getter())
        return stored.get(key)
      }
    }
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'PnPClientStorage' ? PnPClientStorage : target[prop])
  })
})

import { clearProjectsCache } from 'pp365-shared-library'
import resource from 'SharedResources'
import { DataAdapter } from './DataAdapter'

/** The `Gt` fields of the hub's Projects list and their types: `SPProjectItem`'s, and a number. */
const PROJECT_LIST_FIELDS: Record<string, string> = {
  GtGroupId: 'Text',
  GtSiteId: 'Text',
  GtSiteUrl: 'Text',
  GtProjectPhaseText: 'Text',
  GtProjectTypeText: 'Note',
  GtProjectServiceAreaText: 'Note',
  GtProjectLifecycleStatus: 'Choice',
  GtStartDate: 'DateTime',
  GtEndDate: 'DateTime',
  GtProjectOwner: 'User',
  GtProjectManager: 'User',
  GtIsProgram: 'Boolean',
  GtIsParentProject: 'Boolean',
  GtProjectTemplate: 'Text',
  GtProjectExtensions: 'Note',
  GtProjectListContent: 'Note',
  GtProjectNumber: 'Text'
}

/** The one project on the hub, with its owner and manager. */
const PROJECT: Record<string, any> = {
  Id: 1,
  Title: 'Alfa',
  GtSiteId: 'site-1',
  GtSiteUrl: '/sites/alfa',
  GtProjectPhaseText: 'Konsept',
  GtProjectOwnerId: 7,
  GtProjectManagerId: 9,
  GtProjectNumber: 'P-42'
}

const USERS = [
  { Id: 7, Title: 'Kari Nordmann', Email: 'kari@contoso.no' },
  { Id: 9, Title: 'Ola Nordmann', Email: 'ola@contoso.no' }
]

/** The fields and person fields of the project card and the project list, as they are added. */
const CARD_FIELDS = {
  primaryField: 'GtProjectServiceAreaText',
  secondaryField: 'GtProjectTypeText',
  primaryUserField: 'GtProjectOwner',
  secondaryUserField: 'GtProjectManager'
}

/**
 * The adapter on a hub whose Projects list answers as SharePoint does: an items query gives the
 * fields it selects, and fails with a 400 for a field the list does not have and for a person
 * field asked for by name rather than by its `…Id`; the list's fields are read through `fields`.
 * `requests` records the selects and the field reads.
 *
 * @param fieldsReadable Whether the list's fields can be read
 */
function adapterOnHub(fieldsReadable = true) {
  const requests = { selects: [] as string[][], fieldReads: 0 }
  const isPerson = (name: string) => PROJECT_LIST_FIELDS[name] === 'User'
  const isSelectable = (name: string) =>
    ['Id', 'Title'].includes(name) ||
    (name in PROJECT_LIST_FIELDS && !isPerson(name)) ||
    (/Id$/.test(name) && isPerson(name.slice(0, -2)))
  const items = () => {
    let selected: string[] = []
    const query: any = {
      select: (...names: string[]) => {
        selected = names
        requests.selects.push(names)
        return query
      },
      filter: () => query,
      top: () => query,
      async *[Symbol.asyncIterator]() {
        const invalid = selected.find((name) => !isSelectable(name))
        if (invalid) throw new Error(`The field or property '${invalid}' cannot be selected.`)
        yield [
          Object.fromEntries(
            selected.filter((name) => name in PROJECT).map((name) => [name, PROJECT[name]])
          )
        ]
      }
    }
    return query
  }
  const projectsList = {
    fields: {
      select: () => ({
        filter: () => () => {
          requests.fieldReads++
          return fieldsReadable
            ? Promise.resolve(
                Object.keys(PROJECT_LIST_FIELDS).map((InternalName) => ({
                  InternalName,
                  TypeAsString: PROJECT_LIST_FIELDS[InternalName]
                }))
              )
            : Promise.reject(new Error('Tilgang nektet'))
        }
      })
    },
    get items() {
      return items()
    }
  }
  const templatesList = { items: { select: () => () => Promise.resolve([]) } }
  const sp: any = {
    web: {
      lists: {
        getByTitle: (title: string) =>
          title === resource.Lists_Projects_Title ? projectsList : templatesList
      },
      siteUsers: { select: () => () => Promise.resolve(USERS) }
    },
    search: () => Promise.resolve({ PrimarySearchResults: [], TotalRows: 0 })
  }
  const spfxContext: any = { pageContext: { site: { id: { toString: () => 'hub-1' } } } }
  return { adapter: new DataAdapter(spfxContext, sp), requests }
}

/** Every field the adapter has asked the Projects list's items for. */
const selected = (requests: { selects: string[][] }) => ([] as string[]).concat(...requests.selects)

beforeEach(() => {
  clearProjectsCache()
  stored.clear()
})

describe('fetchEnrichedProject, for the project card', () => {
  it("finds the card's people", async () => {
    // Without the person fields no person was found: the card showed «Ikke satt» since 1.12.0.
    const { adapter } = adapterOnHub()
    const project = await adapter.fetchEnrichedProject('site-1', undefined, CARD_FIELDS)
    expect(project.primaryUser).toMatchObject({ name: 'Kari Nordmann', role: 'GtProjectOwner' })
    expect(project.secondaryUser).toMatchObject({ name: 'Ola Nordmann', role: 'GtProjectManager' })
  })

  it('fetches a field chosen in its pane, also when the project was fetched before', async () => {
    // The fields are part of the 30-minute cache key, or the card would show the project as it
    // was fetched before the field was chosen.
    const { adapter } = adapterOnHub()
    await adapter.fetchEnrichedProject('site-1', undefined, CARD_FIELDS)
    const project = await adapter.fetchEnrichedProject('site-1', undefined, {
      ...CARD_FIELDS,
      primaryField: 'GtProjectNumber'
    })
    expect(project.data).toMatchObject({ GtProjectNumber: 'P-42' })
  })

  it('leaves out fields the Projects list does not have, and still shows the project', async () => {
    // The pane offers every project column, the status columns among them: one in the query
    // fails it with a 400, and the card could not show the project.
    const { adapter, requests } = adapterOnHub()
    const project = await adapter.fetchEnrichedProject('site-1', undefined, {
      ...CARD_FIELDS,
      primaryField: 'GtOverallStatus',
      primaryUserField: 'GtProjectSponsor'
    })
    expect(project.title).toBe('Alfa')
    expect(selected(requests)).not.toContain('GtOverallStatus')
    expect(selected(requests)).not.toContain('GtProjectSponsorId')
  })
})

describe('fetchEnrichedProjects, for the project list', () => {
  it('leaves out fields the Projects list does not have, and still lists the projects', async () => {
    // One such field in the query failed it with a 400, and the list showed only its error.
    const { adapter, requests } = adapterOnHub()
    const projects = await adapter.fetchEnrichedProjects({
      ...CARD_FIELDS,
      primaryField: 'GtOverallStatus'
    })
    expect(projects.map((project) => project.title)).toEqual(['Alfa'])
    expect(projects[0].primaryUser).toMatchObject({ name: 'Kari Nordmann' })
    expect(selected(requests)).not.toContain('GtOverallStatus')
  })

  it('leaves out a person column chosen as a field, which SharePoint gives only by its id', async () => {
    // The fields' dropdowns offer the person columns too: asked for by name, the query failed.
    const { adapter, requests } = adapterOnHub()
    const projects = await adapter.fetchEnrichedProjects({
      ...CARD_FIELDS,
      secondaryField: 'GtProjectManager'
    })
    expect(projects.map((project) => project.title)).toEqual(['Alfa'])
    expect(selected(requests)).not.toContain('GtProjectManager')
    expect(selected(requests)).toContain('GtProjectManagerId')
  })

  it("reads the Projects list's fields once for the hub, for the list and the card", async () => {
    const { adapter, requests } = adapterOnHub()
    await adapter.fetchEnrichedProjects(CARD_FIELDS)
    await adapter.fetchEnrichedProject('site-1', undefined, CARD_FIELDS)
    expect(requests.fieldReads).toBe(1)
  })

  it("selects only the project's own fields when the list's fields cannot be read", async () => {
    const { adapter, requests } = adapterOnHub(false)
    const projects = await adapter.fetchEnrichedProjects({
      ...CARD_FIELDS,
      primaryField: 'GtProjectNumber'
    })
    expect(projects.map((project) => project.title)).toEqual(['Alfa'])
    expect(projects[0].primaryUser).toMatchObject({ name: 'Kari Nordmann' })
    expect(selected(requests)).not.toContain('GtProjectNumber')
  })
})
