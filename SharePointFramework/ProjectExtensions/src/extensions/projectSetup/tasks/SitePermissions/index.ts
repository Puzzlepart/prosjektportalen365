import SPDataAdapter from 'data/SPDataAdapter'
import strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'extensions/projectSetup'
import { NO_TEMPLATE_ID } from '../../constants'
import { isEmpty } from 'underscore'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import { IPermissionConfiguration } from './types'
import { ICamlQuery } from '@pnp/sp/lists'
import { ISiteUserProps } from '@pnp/sp/site-users'
import resource from 'SharedResources'

/**
 * Sets up permissions for the SP web.
 *
 * Errors currently doesn't break the setup. Setup continues
 * gracefully on error.
 */
export class SitePermissions extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('SitePermissions', data)
  }

  /**
   * Execute SitePermissions
   *
   * @param params - Task parameters
   * @param onProgress - On progress funtion
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    try {
      onProgress(strings.SitePermissionsText, strings.SitePermissionsSubText, 'Permissions', {
        message: 'Starting site permissions configuration',
        level: 'info'
      })
      const [permConfig, roleDefinitions] = await Promise.all([
        this._getPermissionConfiguration(),
        this._getRoleDefinitions(params.web)
      ])

      for (let i = 0; i < permConfig.length; i++) {
        try {
          const { groupName, permissionLevel } = permConfig[i]
          const siteGroup = await this._getSiteGroupByName(groupName)

          const users = siteGroup || []
          if (isEmpty(users)) continue
          const roleDefId = roleDefinitions[permissionLevel]
          if (roleDefId) {
            // Reuse the group if it already exists on the project web (the setup
            // wizard may be re-run on the same site). Blindly adding a group whose
            // name is taken returns a 500 ("navn er allerede i bruk"), so
            // ensure-then-add to keep the task idempotent.
            let group
            let groupId: number
            try {
              const existing = await params.web.siteGroups.getByName(groupName).select('Id')<{
                Id: number
              }>()
              group = params.web.siteGroups.getByName(groupName)
              groupId = existing.Id
              this.logInformation(`Reusing existing group ${groupName} (id ${groupId}).`)
            } catch {
              this.logInformation(
                `Creating group ${groupName} with permission level ${permissionLevel}...`
              )
              const added = await params.web.siteGroups.add({ Title: groupName })
              group = added.group
              groupId = added.data.Id
            }
            // Re-adding an existing role assignment can also fail — guard it so it
            // doesn't abort the user-add loop below.
            try {
              await params.web.roleAssignments.add(groupId, roleDefId)
            } catch (error) {
              this.logInformation(`Role assignment for ${groupName} already present. ${error}`)
            }
            for (let j = 0; j < users.length; j++) {
              this.logInformation(`Adding user ${users[j]} to group ${groupName}...`)
              try {
                await group.users.add(users[j])
                this.logInformation(`User ${users[j]} successfully added to group ${groupName}.`)
              } catch (error) {
                this.logError(`Failed to add user ${users[j]} to group ${groupName}.`)
              }
            }
          }
        } catch (error) {
          this.logError(`Failed to create group ${permConfig[i].groupName}. ${error}`)
        }
      }
      return params
    } catch (error) {
      this.logError(`Failed to set site permissions from configuration list. ${error}`)
      return params
    }
  }

  /**
   * Get configurations for the selected template from list,
   * if no template is selected the all configurations are returned.
   *
   * @returns Permission configurations
   *
   */
  private async _getPermissionConfiguration(): Promise<IPermissionConfiguration[]> {
    const list = SPDataAdapter.portalDataService.web.lists.getByTitle(
      resource.Lists_Permission_Configuration_Title
    )

    const query: ICamlQuery = {
      ViewXml:
        this.data.selectedTemplate?.id === NO_TEMPLATE_ID
          ? `<View>
    <Query>
      <Where>
        <IsNull>
          <FieldRef Name='GtTemplates' />
        </IsNull>
      </Where>
    </Query>
</View>`
          : `<View>
    <Query>
      <Where>
        <Or>
          <Eq>
            <FieldRef Name='GtTemplates' LookupId='TRUE' />
            <Value Type='LookupMulti'>${this.data.selectedTemplate.id}</Value>
          </Eq>
          <IsNull>
            <FieldRef Name='GtTemplates' />
          </IsNull>
        </Or>
      </Where>
    </Query>
</View>`
    }

    return (await list.getItemsByCAMLQuery(query)).map(
      (item: any) =>
        ({
          groupName: item.GtSPGroupName,
          permissionLevel: item.GtPermissionLevel
        } as IPermissionConfiguration)
    )
  }

  /**
   * Get site groups with users from the portal web
   */
  private async _getSiteGroups() {
    return (
      await SPDataAdapter.portalDataService.web.siteGroups
        .select('Title', 'Users')
        .expand('Users')()
    ).reduce(
      (grps, grp) => ({
        ...grps,
        [grp.Title]: grp['Users'] && grp['Users'].map((u: ISiteUserProps) => u.LoginName)
      }),
      {}
    )
  }

  /**
   * Get site group by name with users from the portal web
   */
  private async _getSiteGroupByName(groupName: string) {
    try {
      const group = await SPDataAdapter.portalDataService.web.siteGroups
        .getByName(groupName)
        .select('Title', 'Users')
        .expand('Users')()
      return group['Users'] && group['Users'].map((u: ISiteUserProps) => u.LoginName)
    } catch (error) {
      throw new Error(`Failed to get site group by name ${groupName}. ${error}`)
    }
  }

  /**
   * Get role definitions for the specified web
   *
   * @param web Web
   */
  private async _getRoleDefinitions(web: any) {
    return (await web.roleDefinitions.select('Name', 'Id')()).reduce(
      (rds: { [key: string]: string }, { Name, Id }) => ({
        ...rds,
        [Name]: Id
      }),
      {}
    )
  }
}
