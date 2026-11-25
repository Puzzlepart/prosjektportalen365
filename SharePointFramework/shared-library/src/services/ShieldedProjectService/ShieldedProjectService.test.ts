import { ShieldedProjectService } from './ShieldedProjectService'

const PROJECT_URL = 'https://contoso.sharepoint.com/sites/skjermet'
const PROJECT = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'
const TEMPLATE = `${PROJECT}00A1B2C3D4E5F60718293A4B5C6D7E8F90`
const READER = 7

/**
 * The hub and the project site through structural stand-ins for the parts of PnPjs the service
 * uses outside JSOM. The hub answers for its content types. The project site has the content
 * types in `siteContentTypes` and the groups in `groups`, by name and ID; its list inherits from
 * the site unless `unique` is set. What the service does is recorded in `did`.
 */
function sites({
  siteContentTypes = [] as string[],
  groups = {} as Record<string, number>,
  unique = false,
  created = true
} = {}) {
  const did = {
    hubReads: [] as string[],
    contentTypes: [] as any[][],
    ensured: [] as any[][],
    inheritanceBroken: [] as boolean[][],
    roleAssignments: [] as number[][]
  }
  const hubWeb = {
    contentTypes: {
      getById: (id: string) => ({
        select: () => () => {
          did.hubReads.push(id)
          const isTemplate = id === TEMPLATE
          return Promise.resolve({
            Name: isTemplate ? 'Byggeprosjekt' : 'Prosjekt',
            Description: isTemplate ? null : 'Et prosjekt',
            Group: 'Prosjektportalen innholdstyper'
          })
        }
      })
    }
  }
  const list = {
    select: () => () => Promise.resolve({ HasUniqueRoleAssignments: unique }),
    breakRoleInheritance: (...args: boolean[]) => {
      did.inheritanceBroken.push(args)
      return Promise.resolve()
    },
    roleAssignments: {
      add: (groupId: number, roleId: number) => {
        did.roleAssignments.push([groupId, roleId])
        return Promise.resolve()
      }
    }
  }
  const projectWeb = {
    contentTypes: {
      select: () => () => Promise.resolve(siteContentTypes.map((StringId) => ({ StringId }))),
      add: (...args: any[]) => {
        did.contentTypes.push(args)
        return Promise.resolve()
      }
    },
    roleDefinitions: { getByType: () => ({ select: () => () => Promise.resolve({ Id: READER }) }) },
    siteGroups: {
      getByName: (name: string) => ({
        select: () => () =>
          name in groups
            ? Promise.resolve({ Id: groups[name] })
            : Promise.reject(new Error('Gruppen finnes ikke'))
      })
    },
    lists: {
      ensure: (...args: any[]) => {
        did.ensured.push(args)
        return Promise.resolve({ list, created })
      }
    }
  }
  const service = new ShieldedProjectService(hubWeb as any, projectWeb as any, PROJECT_URL)
  return { service, did, list }
}

describe('ShieldedProjectService', () => {
  describe('ensureContentType', () => {
    it("makes the content types the site lacks with the hub's IDs, names and groups, the one a template's own is built on first", async () => {
      const { service, did } = sites()
      await service.ensureContentType(TEMPLATE)
      expect(did.contentTypes).toEqual([
        [PROJECT, 'Prosjekt', 'Et prosjekt', 'Prosjektportalen innholdstyper'],
        // A content type without a description on the hub gets an empty one.
        [TEMPLATE, 'Byggeprosjekt', '', 'Prosjektportalen innholdstyper']
      ])
    })

    it('keeps the content types the site has, however their IDs are written, and reads only the missing ones from the hub', async () => {
      const { service, did } = sites({ siteContentTypes: [PROJECT.toLowerCase()] })
      await service.ensureContentType(TEMPLATE)
      expect(did.contentTypes.map(([id]) => id)).toEqual([TEMPLATE])
      expect(did.hubReads).toEqual([TEMPLATE])
      const all = sites({ siteContentTypes: [PROJECT, TEMPLATE] })
      await all.service.ensureContentType(TEMPLATE)
      expect(all.did.contentTypes).toEqual([])
      expect(all.did.hubReads).toEqual([])
    })
  })

  describe('grantRead', () => {
    it("breaks the list's inheritance from the site once, keeping the site's own groups, and gives each group read access", async () => {
      const { service, did, list } = sites({ groups: { Porteføljeinnsyn: 31, Revisjon: 32 } })
      await service.grantRead(list as any, ['Porteføljeinnsyn', 'Revisjon'])
      // Copying the role assignments keeps the project's own groups on the list.
      expect(did.inheritanceBroken).toEqual([[true, false]])
      expect(did.roleAssignments).toEqual([
        [31, READER],
        [32, READER]
      ])
    })

    it('leaves the inheritance of a list that has its own access as it is, when the setup runs again', async () => {
      const { service, did, list } = sites({ groups: { Porteføljeinnsyn: 31 }, unique: true })
      await service.grantRead(list as any, ['Porteføljeinnsyn'])
      expect(did.inheritanceBroken).toEqual([])
      expect(did.roleAssignments).toEqual([[31, READER]])
    })

    it('goes on with the other groups when one is not on the site', async () => {
      const { service, did, list } = sites({ groups: { Revisjon: 32 } })
      await service.grantRead(list as any, ['Porteføljeinnsyn', 'Revisjon'])
      expect(did.roleAssignments).toEqual([[32, READER]])
    })
  })

  describe('ensureList', () => {
    it('makes a hidden library with versions for a list without a content type, and gives the groups read access to it', async () => {
      const { service, did } = sites({ groups: { Porteføljeinnsyn: 31 } })
      const result = await service.ensureList({
        listName: 'Prosjektstatusvedlegg',
        template: 101,
        readerGroupNames: ['Porteføljeinnsyn']
      })
      expect(did.ensured).toEqual([
        ['Prosjektstatusvedlegg', '', 101, false, { Hidden: true, EnableVersioning: true }]
      ])
      expect(did.contentTypes).toEqual([])
      expect(did.roleAssignments).toEqual([[31, READER]])
      expect(result.created).toBe(true)
      expect(result.listContentTypeId).toBeUndefined()
    })

    it('leaves the access of a list alone when no group is to read it', async () => {
      const { service, did } = sites()
      await service.ensureList({ listName: 'Prosjektstatusvedlegg', template: 101 })
      expect(did.inheritanceBroken).toEqual([])
      expect(did.roleAssignments).toEqual([])
    })
  })
})
