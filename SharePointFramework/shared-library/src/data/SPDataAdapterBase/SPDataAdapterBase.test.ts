import resource from 'SharedResources'
import { ItemFieldValues, ProjectAdminRole } from '../../models'
import { SPDataAdapterBase } from '.'
import { ProjectAdminPermission } from './types'

/**
 * Who may administer a project: the roles named in the project's properties, each of them a site
 * admin, a person field of the project or a SharePoint group on the project or the hub, granting
 * its permissions. The project site and the hub are structural stand-ins for the PnPjs calls.
 */
const { ProjectStatusAdmin, ChangePhase, EditProjectProperties } = ProjectAdminPermission

const role = (
  type: 'property' | 'group' | 'admin',
  title: string,
  permissions: ProjectAdminPermission[],
  extra: Record<string, any> = {}
) =>
  new ProjectAdminRole({
    Id: 1,
    Title: title,
    ContentTypeId: `0x0100618197F7C782A0459EB2FA5EBF1BDDF20${{ property: 1, group: 2, admin: 3 }[type]}00AB`,
    GtProjectAdminPermissions: permissions.map((p) => ({ GtProjectAdminPermissionId: p })),
    ...extra
  } as any)

const ROLES = [
  role('admin', 'Områdeadministrator', [EditProjectProperties]),
  role('property', 'Prosjektleder', [ProjectStatusAdmin, ChangePhase], {
    GtProjectFieldName: 'GtProjectManager'
  }),
  role('property', 'Prosjekteier', [ProjectStatusAdmin], { GtProjectFieldName: 'GtProjectOwner' }),
  role('group', 'Styringsgruppe', [ChangePhase], {
    GtGroupName: 'Styringsgruppen',
    GtGroupLevel: resource.Lists_ProjectAdminRoles_GroupLevel_Portfolio
  }),
  role('group', 'Prosjektgruppe', [ProjectStatusAdmin], {
    GtGroupName: 'Prosjektmedlemmer',
    GtGroupLevel: resource.Lists_ProjectAdminRoles_GroupLevel_Project
  })
]

interface ISite {
  isSiteAdmin?: boolean
  userId?: number
  groups?: Record<string, string[]>
}

/** A web whose current user has the given rights and memberships. */
function web({ isSiteAdmin = false, userId = 12, groups = {} }: ISite, properties?: any) {
  return {
    currentUserHasPermissions: () => Promise.resolve(isSiteAdmin),
    ensureUser: () =>
      userId
        ? Promise.resolve({ Id: userId, Email: 'kari@contoso.no' })
        : Promise.reject(new Error('404')),
    lists: {
      getByTitle: () => ({
        items: { top: () => () => Promise.resolve(properties ? [properties] : []) }
      })
    },
    siteGroups: {
      getByName: (name: string) => ({
        users: {
          // As SharePoint does, the query answers with the members its filter names.
          filter: (query: string) => () =>
            groups[name] === undefined
              ? Promise.reject(new Error('Gruppen finnes ikke'))
              : Promise.resolve(
                  groups[name]
                    .filter((email) => query.includes(`'${email}'`))
                    .map((Email) => ({ Email }))
                )
        }
      })
    }
  }
}

function adapter(
  project: ISite,
  { hub = {} as ISite, available = true, roles = ROLES, properties = undefined as any } = {}
) {
  const instance = new SPDataAdapterBase()
  instance.spfxContext = {
    pageContext: { user: { loginName: 'kari', email: 'kari@contoso.no' } }
  } as any
  instance.sp = { web: web(project, properties) } as any
  instance.portalDataService = {
    isAvailable: available,
    web: web(hub),
    getProjectAdminRoles: () => Promise.resolve(roles)
  } as any
  return instance
}

const projectProperties = (values: Record<string, any>) =>
  new ItemFieldValues({ GtProjectAdminRoles: ROLES.map(({ title }) => title), ...values })

beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined))
afterEach(() => jest.restoreAllMocks())

describe('SPDataAdapterBase.checkProjectAdminPermissions', () => {
  it('lets the project manager and the owners have what their roles give', async () => {
    const properties = projectProperties({ GtProjectManagerId: 12, GtProjectOwnerId: [13, 14] })
    const manager = adapter({ userId: 12 })
    expect(await manager.checkProjectAdminPermissions(ChangePhase, properties)).toBe(true)
    expect(await manager.checkProjectAdminPermissions(EditProjectProperties, properties)).toBe(
      false
    )
    const owner = adapter({ userId: 14 })
    expect(await owner.checkProjectAdminPermissions(ProjectStatusAdmin, properties)).toBe(true)
    expect(await owner.checkProjectAdminPermissions(ChangePhase, properties)).toBe(false)
  })

  it("gives site admins their role's permissions", async () => {
    const properties = projectProperties({})
    expect(
      await adapter({ isSiteAdmin: true, userId: 99 }).checkProjectAdminPermissions(
        EditProjectProperties,
        properties
      )
    ).toBe(true)
  })

  it('gives the members of a group on the hub or the project what the group gives', async () => {
    const properties = projectProperties({})
    const steering = adapter(
      { userId: 99 },
      { hub: { groups: { Styringsgruppen: ['kari@contoso.no'] } } }
    )
    expect(await steering.checkProjectAdminPermissions(ChangePhase, properties)).toBe(true)
    const team = adapter({ userId: 99, groups: { Prosjektmedlemmer: ['kari@contoso.no'] } })
    expect(await team.checkProjectAdminPermissions(ProjectStatusAdmin, properties)).toBe(true)
    const outsider = adapter({ userId: 99, groups: { Prosjektmedlemmer: ['ola@contoso.no'] } })
    expect(await outsider.checkProjectAdminPermissions(ProjectStatusAdmin, properties)).toBe(false)
  })

  it('goes on to the other roles when a group cannot be read', async () => {
    const properties = projectProperties({ GtProjectManagerId: 12 })
    expect(
      await adapter({ userId: 12 }).checkProjectAdminPermissions(ProjectStatusAdmin, properties)
    ).toBe(true)
  })

  it('goes on to the other roles when a role names a field the project does not have', async () => {
    const roles = [
      role('property', 'Kontaktperson', [ChangePhase], { GtProjectFieldName: 'GtContact' }),
      ...ROLES
    ]
    const properties = new ItemFieldValues({
      GtProjectAdminRoles: ['Kontaktperson', 'Prosjektleder'],
      GtProjectManagerId: 12
    })
    expect(
      await adapter({ userId: 12 }, { roles }).checkProjectAdminPermissions(ChangePhase, properties)
    ).toBe(true)
  })

  it('lets a site admin do everything on a project that names no roles', async () => {
    const properties = new ItemFieldValues({ GtProjectAdminRoles: [] })
    expect(
      await adapter({ isSiteAdmin: true }).checkProjectAdminPermissions(ChangePhase, properties)
    ).toBe(true)
    expect(
      await adapter({ isSiteAdmin: false }).checkProjectAdminPermissions(ChangePhase, properties)
    ).toBe(false)
  })

  it("reads the project's own properties when it is given none", async () => {
    const properties = { GtProjectAdminRoles: ['Prosjektleder'], GtProjectManagerId: 12 }
    expect(
      await adapter({ userId: 12 }, { properties }).checkProjectAdminPermissions(ChangePhase)
    ).toBe(true)
    expect(await adapter({ userId: 12 }).checkProjectAdminPermissions(ChangePhase)).toBe(false)
  })

  it('asks only for site admin rights when the hub is out of reach', async () => {
    const properties = projectProperties({ GtProjectManagerId: 12 })
    expect(
      await adapter({ isSiteAdmin: true }, { available: false }).checkProjectAdminPermissions(
        ChangePhase,
        properties
      )
    ).toBe(true)
    expect(
      await adapter({ userId: 12 }, { available: false }).checkProjectAdminPermissions(
        ChangePhase,
        properties
      )
    ).toBe(false)
  })

  it('gives nothing when the user cannot be resolved, except through site admin rights', async () => {
    const properties = projectProperties({ GtProjectManagerId: 12 })
    expect(await adapter({ userId: 0 }).checkProjectAdminPermissions(ChangePhase, properties)).toBe(
      false
    )
    expect(
      await adapter({ userId: 0, isSiteAdmin: true }).checkProjectAdminPermissions(
        EditProjectProperties,
        properties
      )
    ).toBe(true)
  })

  it('gives nothing without a page context', async () => {
    const instance = adapter({ isSiteAdmin: true })
    instance.spfxContext = {} as any
    expect(await instance.checkProjectAdminPermissions(ChangePhase, projectProperties({}))).toBe(
      false
    )
  })
})

describe('SPDataAdapterBase.clientPeoplePickerSearchUser', () => {
  it('finds the people, without those already picked', async () => {
    const instance = new SPDataAdapterBase()
    const search = jest.fn(() =>
      Promise.resolve([
        {
          Key: 'k1',
          DisplayText: 'Kari Nordmann',
          EntityData: { Email: 'kari@contoso.no', Title: 'Rådgiver', Department: 'Kultur' }
        },
        {
          Key: 'k2',
          DisplayText: 'Ola Nordmann',
          EntityData: { Email: 'ola@contoso.no', Title: 'Leder', Department: 'Helse' }
        }
      ])
    )
    instance.sp = { profiles: { clientPeoplePickerSearchUser: search } } as any
    const people = await instance.clientPeoplePickerSearchUser('nordmann', [
      { secondaryText: 'ola@contoso.no' }
    ])
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ QueryString: 'nordmann', MaximumEntitySuggestions: 50 })
    )
    expect(people).toEqual([
      {
        id: 'k1',
        text: 'Kari Nordmann',
        secondaryText: 'kari@contoso.no',
        tertiaryText: 'Rådgiver',
        optionalText: 'Kultur',
        imageUrl: '/_layouts/15/userphoto.aspx?AccountName=kari@contoso.no&size=L'
      }
    ])
  })
})
