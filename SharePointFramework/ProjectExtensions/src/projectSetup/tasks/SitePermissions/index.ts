import SPDataAdapter from 'data/SPDataAdapter'
import strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'projectSetup'
import { isEmpty } from 'underscore'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import { IPermissionConfiguration } from './types'
import { ICamlQuery } from '@pnp/sp/lists'
import { ISiteUserProps } from '@pnp/sp/site-users'

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
      onProgress(strings.SitePermissionsText, strings.SitePermissionsSubText, 'Permissions')
      const [permConfig, roleDefinitions, groups] = await Promise.all([
        this._getPermissionConfiguration(),
        this._getRoleDefinitions(params.web),
        this._getSiteGroups()
      ])

      for (let i = 0; i < permConfig.length; i++) {
        const { groupName, permissionLevel } = permConfig[i]
        const users = groups[groupName] || []
        if (isEmpty(users)) continue
        const roleDefId = roleDefinitions[permissionLevel]
        if (roleDefId) {
          this.logInformation(
            `Creating group ${groupName} with permission level ${permissionLevel}...`
          )
          const { group, data } = await params.web.siteGroups.add({ Title: groupName })
          await params.web.roleAssignments.add(data.Id, roleDefId)
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
      strings.PermissionConfigurationList
    )

    const query: ICamlQuery = {
      ViewXml: `<View>
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
