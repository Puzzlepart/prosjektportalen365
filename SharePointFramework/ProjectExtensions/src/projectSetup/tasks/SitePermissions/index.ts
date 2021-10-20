/* eslint-disable no-console */
import { SiteUserProps, List } from '@pnp/sp'
import strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'projectSetup'
import { isEmpty } from 'underscore'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'
import { IPermissionConfiguration } from './types'

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
   * @param params Task parameters
   * @param onProgress On progress funtion
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    try {
      onProgress(strings.SitePermissionsText, strings.SitePermissionsSubText, 'Permissions')
      const list = this.data.hub.web.lists.getByTitle(strings.PermissionConfigurationList)
      const [config, roleDefinitions, groups] = await Promise.all([
        this._getConfiguration(list),
        this._getRoleDefinitions(params.web),
        this._getGroups(this.data.hub.web)
      ])
      for (let i = 0; i < config.length; i++) {
        const { groupName, permissionLevel } = config[i]
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
            await group.users.add(users[j])
          }
        }
      }
      return params
    } catch (error) {
      this.logError('Failed to set site permissions from configuration list.')
      return params
    }
  }

  /**
   * Get configuration from the specified list
   *
   * @param list List
   */
  private async _getConfiguration(list: List): Promise<IPermissionConfiguration[]> {
    return (await list.items.select('GtPermissionLevel', 'GtSPGroupName').get()).map((item) => ({
      groupName: item.GtSPGroupName,
      permissionLevel: item.GtPermissionLevel
    }))
  }

  /**
   * Get groups with users from specified web
   *
   * @param web Web
   */
  private async _getGroups(web: any) {
    return (await web.siteGroups.select('Title', 'Users').expand('Users').get()).reduce(
      (grps, { Title, Users }) => ({
        ...grps,
        [Title]: Users.map((u: SiteUserProps) => u.LoginName)
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
    return (await web.roleDefinitions.select('Name', 'Id').get()).reduce(
      (rds: { [key: string]: string }, { Name, Id }) => ({
        ...rds,
        [Name]: Id
      }),
      {}
    )
  }
}
