// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The hub is a stand-in: `hub.rows` are the rows of
// `Tillatelseskonfigurasjon`, and `hub.groups` the hub's groups with the login names in them.
const hub = {
  rows: [] as Record<string, any>[],
  groups: {} as Record<string, string[]>
}
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: {
    portalDataService: {
      web: {
        lists: { getByTitle: () => ({ getItemsByCAMLQuery: () => Promise.resolve(hub.rows) }) },
        siteGroups: {
          getByName: (name: string) => ({
            select: () => ({
              expand: () => () =>
                name in hub.groups
                  ? Promise.resolve({
                      Title: name,
                      Users: hub.groups[name].map((LoginName) => ({ LoginName }))
                    })
                  : Promise.reject(new Error('Gruppen finnes ikke'))
            })
          })
        }
      }
    }
  }
}))

import resource from 'SharedResources'
import { SitePermissions } from '.'

const READ = 'Lese'
const INSIGHT = resource.Security_SiteGroup_PortfolioInsight_Title
const SHIELDED_LISTS = resource.Choice_GtPermissionScope_ShieldedLists

/** A row of the permission configuration. */
const row = (GtSPGroupName: string, GtPermissionLevel: string, GtPermissionScope?: string) => ({
  GtSPGroupName,
  GtPermissionLevel,
  GtPermissionScope
})

/**
 * The project site: `existing` are the groups it has already, by name and ID. What the task does
 * to the site is recorded in `site`.
 */
function projectSite(existing: Record<string, number> = {}) {
  const site = {
    created: [] as string[],
    roleAssignments: [] as [number, number][],
    members: {} as Record<string, string[]>
  }
  const ids: Record<string, number> = { ...existing }
  const group = (name: string) => ({
    users: {
      add: (login: string) => {
        site.members[name] = [...(site.members[name] ?? []), login]
        return Promise.resolve()
      }
    }
  })
  const nameOf = (id: number) => Object.keys(ids).find((name) => ids[name] === id)
  const web = {
    roleDefinitions: { select: () => () => Promise.resolve([{ Name: READ, Id: 5 }]) },
    siteGroups: {
      getByName: (name: string) => ({
        ...group(name),
        select: () => () =>
          name in ids
            ? Promise.resolve({ Id: ids[name] })
            : Promise.reject(new Error('Gruppen finnes ikke'))
      }),
      add: ({ Title }: { Title: string }) => {
        ids[Title] = 100 + site.created.length
        site.created.push(Title)
        return Promise.resolve({ Id: ids[Title] })
      },
      getById: (id: number) => group(nameOf(id))
    },
    roleAssignments: {
      add: (groupId: number, roleDefId: number) => {
        site.roleAssignments.push([groupId, roleDefId])
        return Promise.resolve()
      }
    }
  }
  return { site, web }
}

/** Runs the task on a project site, shielded or not, and gives what it did and left in the data. */
async function run(isShieldedProject: boolean, existing: Record<string, number> = {}) {
  const { site, web } = projectSite(existing)
  const data = { selectedTemplate: { id: 1 }, isShieldedProject } as any
  await new SitePermissions(data).execute({ web } as any, jest.fn())
  return { site, data }
}

beforeEach(() => {
  hub.rows = []
  hub.groups = { [INSIGHT]: ['kari@contoso.no', 'ola@contoso.no'], Prosjektlesere: ['per'] }
})

describe('SitePermissions', () => {
  it('gives a group its permission level on the site, with the members it has on the hub', async () => {
    hub.rows = [
      row('Prosjektlesere', READ),
      row(INSIGHT, READ, resource.Choice_GtPermissionScope_Site)
    ]
    const { site, data } = await run(false)
    expect(site.created).toEqual(['Prosjektlesere', INSIGHT])
    expect(site.roleAssignments).toEqual([
      [100, 5],
      [101, 5]
    ])
    expect(site.members).toEqual({
      Prosjektlesere: ['per'],
      [INSIGHT]: ['kari@contoso.no', 'ola@contoso.no']
    })
    expect(data.shieldedListGroupNames).toEqual([])
  })

  it('makes a group for shielded lists on a shielded project with its members, gives it nothing on the site, and names it for the lists', async () => {
    hub.rows = [row(INSIGHT, READ, SHIELDED_LISTS)]
    const { site, data } = await run(true)
    expect(site.created).toEqual([INSIGHT])
    expect(site.members[INSIGHT]).toEqual(['kari@contoso.no', 'ola@contoso.no'])
    // No role on the site: the group reads the lists for project data, and nothing else.
    expect(site.roleAssignments).toEqual([])
    expect(data.shieldedListGroupNames).toEqual([INSIGHT])
  })

  it('makes the group for shielded lists whatever permission level its row names', async () => {
    hub.rows = [row(INSIGHT, 'Et nivå området ikke har', SHIELDED_LISTS)]
    const { site, data } = await run(true)
    expect(site.created).toEqual([INSIGHT])
    expect(site.roleAssignments).toEqual([])
    expect(data.shieldedListGroupNames).toEqual([INSIGHT])
  })

  it('reuses a group the site has when the setup runs again, and still gives it nothing on the site', async () => {
    hub.rows = [row(INSIGHT, READ, SHIELDED_LISTS)]
    const { site, data } = await run(true, { [INSIGHT]: 42 })
    expect(site.created).toEqual([])
    expect(site.members[INSIGHT]).toEqual(['kari@contoso.no', 'ola@contoso.no'])
    expect(site.roleAssignments).toEqual([])
    expect(data.shieldedListGroupNames).toEqual([INSIGHT])
  })

  it('leaves a group for shielded lists out of a project that is not shielded', async () => {
    hub.rows = [row(INSIGHT, READ, SHIELDED_LISTS), row('Prosjektlesere', READ)]
    const { site, data } = await run(false)
    expect(site.created).toEqual(['Prosjektlesere'])
    expect(site.roleAssignments).toEqual([[100, 5]])
    expect(data.shieldedListGroupNames).toEqual([])
  })

  it('leaves out a group that is empty on the hub, which then reads none of the lists', async () => {
    hub.groups[INSIGHT] = []
    hub.rows = [row(INSIGHT, READ, SHIELDED_LISTS)]
    const { site, data } = await run(true)
    expect(site.created).toEqual([])
    expect(data.shieldedListGroupNames).toEqual([])
  })

  it('goes on with the other groups when one is not on the hub', async () => {
    hub.rows = [row('Finnes ikke', READ, SHIELDED_LISTS), row(INSIGHT, READ, SHIELDED_LISTS)]
    const { site, data } = await run(true)
    expect(site.created).toEqual([INSIGHT])
    expect(data.shieldedListGroupNames).toEqual([INSIGHT])
  })
})
