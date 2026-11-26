// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. JSOM is a stand-in: `jsom.created` records the content types
// it was asked to make and `jsom.urls` on which site, `jsom.storedId` is the ID SharePoint gives
// a new content type when it is not the one asked for, and `jsom.refusal` what a query is
// refused with.
const jsom = {
  created: [] as Record<string, any>[],
  urls: [] as string[],
  storedId: undefined as string | undefined,
  refusal: undefined as unknown
}
jest.mock('spfx-jsom', () => ({
  __esModule: true,
  default: (url: string) => {
    jsom.urls.push(url)
    return Promise.resolve({
      jsomContext: {
        clientContext: { load: () => undefined },
        web: {
          get_contentTypes: () => ({
            add: (information: { values: Record<string, any> }) => {
              jsom.created.push(information.values)
              return { get_stringId: () => jsom.storedId ?? information.values.id }
            }
          })
        }
      }
    })
  },
  ExecuteJsomQuery: () => (jsom.refusal ? Promise.reject(jsom.refusal) : Promise.resolve())
}))
// What `sp.js` gives a page: the service fills in the same object there.
;(globalThis as any).SP = {
  ContentTypeCreationInformation: class {
    public values: Record<string, any> = {}
    public set_id(value: string) {
      this.values.id = value
    }
    public set_name(value: string) {
      this.values.name = value
    }
    public set_description(value: string) {
      this.values.description = value
    }
    public set_group(value: string) {
      this.values.group = value
    }
    public set_parentContentType(value: unknown) {
      this.values.parent = value
    }
  }
}

import strings from 'SharedLibraryStrings'
import { format } from '../../util'
import { ShieldedProjectService } from './ShieldedProjectService'

const PROJECT_URL = 'https://contoso.sharepoint.com/sites/skjermet'
const PROJECT = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'
const TEMPLATE = `${PROJECT}00A1B2C3D4E5F60718293A4B5C6D7E8F90`
const READER = 7

/**
 * The hub and the project site through structural stand-ins for the parts of PnPjs the service
 * uses outside JSOM. The hub answers for its content types. The project site has the content
 * types in `siteContentTypes` and the groups in `groups`, by name and ID; its list inherits from
 * the site unless `unique` is set. What the service does is recorded in `did`: `contentTypes`
 * is what it asked the REST API to make, which leaves the ID out.
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

beforeEach(() => {
  jsom.created = []
  jsom.urls = []
  jsom.storedId = undefined
  jsom.refusal = undefined
})

describe('ShieldedProjectService', () => {
  describe('ensureContentType', () => {
    it("makes the content types the site lacks with the hub's IDs, names and groups, the one a template's own is built on first", async () => {
      const { service, did } = sites()
      await service.ensureContentType(TEMPLATE)
      // No parent: SharePoint reads it out of the ID, and refuses the two together.
      expect(jsom.created).toEqual([
        {
          id: PROJECT,
          name: 'Prosjekt',
          description: 'Et prosjekt',
          group: 'Prosjektportalen innholdstyper'
        },
        // A content type without a description on the hub gets an empty one.
        {
          id: TEMPLATE,
          name: 'Byggeprosjekt',
          description: '',
          group: 'Prosjektportalen innholdstyper'
        }
      ])
      expect(jsom.urls).toEqual([PROJECT_URL, PROJECT_URL])
      // Never through the REST API: there the content type gets an ID of its own, which no
      // list can be given under the hub's ID.
      expect(did.contentTypes).toEqual([])
    })

    it('keeps the content types the site has, however their IDs are written, and reads only the missing ones from the hub', async () => {
      const { service, did } = sites({ siteContentTypes: [PROJECT.toLowerCase()] })
      await service.ensureContentType(TEMPLATE)
      expect(jsom.created.map(({ id }) => id)).toEqual([TEMPLATE])
      expect(did.hubReads).toEqual([TEMPLATE])
      jsom.created = []
      const all = sites({ siteContentTypes: [PROJECT, TEMPLATE] })
      await all.service.ensureContentType(TEMPLATE)
      expect(jsom.created).toEqual([])
      expect(all.did.hubReads).toEqual([])
    })

    it("fails, naming both IDs, when SharePoint stores the content type under another ID than the hub's", async () => {
      const { service } = sites()
      jsom.storedId = '0x01002BAACE12293A264BBB6E77E84B50CD20'
      await expect(service.ensureContentType(PROJECT)).rejects.toThrow(
        format(strings.ShieldedProjectContentTypeIdErrorText, 'Prosjekt', jsom.storedId, PROJECT)
      )
    })

    it('passes on what SharePoint refused the content type with, which the setup reads the message from', async () => {
      const { service } = sites()
      jsom.refusal = {
        sender: {},
        args: { get_message: () => 'Det finnes allerede en innholdstype med navnet "Prosjekt".' }
      }
      await expect(service.ensureContentType(PROJECT)).rejects.toBe(jsom.refusal)
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
      expect(jsom.created).toEqual([])
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
