import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { before, describe, it } from 'node:test'
import { env, skipReason } from '../src/env.ts'
import type { ISite } from '../src/sites.ts'
import { connect } from '../src/sites.ts'

const require = createRequire(import.meta.url)
const resources = require('SharedResources') as Record<string, string>

/** The lists the group reads: those that include `Lists/Security/MinimumReadSecurity.xml`. */
const READ_LISTS = [
  'Lists_Global_Settings_Title',
  'Lists_ProjectAdminRoles_Title',
  'Lists_ProjectAdminPermissions_Title',
  'Lists_ProjectColumns_Title',
  'Lists_ProjectColumnConfiguration_Title',
  'Lists_StatusSections_Title',
  'Lists_TemplateOptions_Title',
  'Lists_TemplateLibrary_Title',
  'Lists_ProjectContentColumns_Title',
  'Lists_DataSources_Title',
  'Lists_HelpContent_Title',
  'Lists_InstallationLog_Title',
  'Lists_Links_Title',
  'Lists_TimelineConfiguration_Title'
]

/** Lists with data about all projects: not part of the group's access by default. */
const NOT_STANDARD_LISTS = [
  'Lists_Projects_Title',
  'Lists_ProjectStatus_Title',
  'Lists_ProjectStatusAttachments_Title',
  'Lists_TimelineContent_Title'
]

/** `RoleType`: SharePoint's own limited access, and Read. */
const LIMITED_ACCESS = 1
const READER = 2

/** Why the tests of the templates' state do not run: the run's upgrade applied no templates. */
const templatesSkip = env.templatesApplied
  ? undefined
  : 'the run applied no templates: INTEGRATION_TEMPLATES_APPLIED is not true (CI sets it after the full upgrade)'

interface IRoleAssignments {
  filter(filter: string): IRoleAssignments
  expand(...expands: string[]): IRoleAssignments
  (): Promise<Array<{ RoleDefinitionBindings: Array<{ RoleTypeKind: number }> }>>
}

/**
 * The group «Minimum lesetilganger på hub» as the template (`Objects/Security.xml`,
 * `Lists/Security/MinimumReadSecurity.xml`) and `Scripts/PostInstall.ps1` leave it on the test hub:
 * no role on the hub itself, Read on the lists projects read, and on the matrix configurations, and
 * nothing on the lists with data about all projects. Read-only.
 */
describe(
  'the group «Minimum lesetilganger på hub»',
  { skip: skipReason('hubUrl') ?? templatesSkip },
  () => {
    let hub: ISite
    let groupId: number

    before(async () => {
      hub = await connect(env.hubUrl!)
      const group = await hub.sp.web.siteGroups
        .getByName(resources.Security_SiteGroup_MinimumHubReadAccess_Title)
        .select('Id')()
      groupId = group.Id
    })

    /**
     * The roles the group holds in the role assignments given, as role types, without SharePoint's
     * limited access, which follows from a role on something below.
     *
     * @param roleAssignments Role assignments of a web, a list or an item
     */
    async function groupRoles(roleAssignments: IRoleAssignments): Promise<number[]> {
      const assignments = await roleAssignments
        .filter(`PrincipalId eq ${groupId}`)
        .expand('RoleDefinitionBindings')()
      return assignments
        .flatMap(({ RoleDefinitionBindings }) =>
          RoleDefinitionBindings.map((role) => role.RoleTypeKind)
        )
        .filter((kind) => kind !== LIMITED_ACCESS)
    }

    it('has no role on the hub itself', async () => {
      assert.deepEqual(
        await groupRoles(hub.sp.web.roleAssignments as unknown as IRoleAssignments),
        []
      )
    })

    it('reads the lists projects need from the hub, each with roles of its own', async () => {
      for (const key of READ_LISTS) {
        const list = hub.sp.web.lists.getByTitle(resources[key])
        const { HasUniqueRoleAssignments } = await list.select('HasUniqueRoleAssignments')<{
          HasUniqueRoleAssignments: boolean
        }>()
        assert.equal(HasUniqueRoleAssignments, true, `${resources[key]} inherits its roles`)
        assert.deepEqual(
          await groupRoles(list.roleAssignments as unknown as IRoleAssignments),
          [READER],
          resources[key]
        )
      }
    })

    it('reads the matrix configurations in Områderessurser', async () => {
      const { Language, ServerRelativeUrl } = await hub.sp.web.select(
        'Language',
        'ServerRelativeUrl'
      )()
      // The folder the content template writes, per language (`Templates/Content/...`).
      const folder = Language === 1033 ? 'Configuration' : 'Konfigurasjon'
      const item = await hub.sp.web
        .getFolderByServerRelativePath(
          `${ServerRelativeUrl.replace(/\/$/, '')}/SiteAssets/${folder}`
        )
        .getItem()
      const { HasUniqueRoleAssignments } = await item.select('HasUniqueRoleAssignments')<{
        HasUniqueRoleAssignments: boolean
      }>()
      assert.equal(HasUniqueRoleAssignments, true, `SiteAssets/${folder} inherits its roles`)
      assert.deepEqual(await groupRoles(item.roleAssignments as unknown as IRoleAssignments), [
        READER
      ])
    })

    it('does not read the lists with data about all projects', async () => {
      for (const key of NOT_STANDARD_LISTS) {
        const list = hub.sp.web.lists.getByTitle(resources[key])
        assert.deepEqual(
          await groupRoles(list.roleAssignments as unknown as IRoleAssignments),
          [],
          resources[key]
        )
      }
    })
  }
)

/**
 * The hub data a project site holds about its hub (`_api/web/HubSiteData`), which the library
 * reads first to find the hub's URL, so that a user who reads none of the hub's pages finds it.
 */
describe("a project site's hub data", { skip: skipReason('hubUrl', 'projectUrl') }, () => {
  it("names the hub's URL", async () => {
    const [hub, project] = await Promise.all([connect(env.hubUrl!), connect(env.projectUrl!)])
    const data = await project.sp.web.hubSiteData()
    assert.equal(
      String(data?.url ?? '')
        .replace(/\/+$/, '')
        .toLowerCase(),
      hub.url.toLowerCase()
    )
  })
})
