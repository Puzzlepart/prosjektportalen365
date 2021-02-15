/* eslint-disable no-console */
import { SiteUserProps } from '@pnp/sp'
import { IProjectSetupData } from 'projectSetup'
import { isEmpty } from 'underscore'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'

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
   * @param {IBaseTaskParams} params Task parameters
   */
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    try {
      const list = this.data.hub.web.lists.getByTitle('Tillatelseskonfigurasjon')
      const [config, roleDefinitions, groups] = await Promise.all([
        list.items.select('GtPermissionLevel', 'GtSPGroupName').get(),
        this._getRoleDefinitions(params.web),
        this._getGroups(this.data.hub.web)
      ])
      for (let i = 0; i < config.length; i++) {
        const groupName = config[i].GtSPGroupName
        const users = groups[groupName] || []
        if (isEmpty(users)) continue
        const roleDefId = roleDefinitions[config[i].GtPermissionLevel]
        if (roleDefId) {
          this.logInformation(`Creating group ${groupName} with permission level ${config[i].GtPermissionLevel}...`)
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
   * Get groups with users from specified web
   * 
   * @param {any} web Web
   */
  private async _getGroups(web: any) {
    return (
      await web.siteGroups
        .select('Title', 'Users')
        .expand('Users')
        .get()
    ).reduce((grps, { Title, Users }) => ({
      ...grps,
      [Title]: Users.map((u: SiteUserProps) => u.LoginName)
    }), {})
  }

  /**
   * Get role definitions for the specified web
   * 
   * @param {any} web Web
   */
  private async _getRoleDefinitions(web: any) {
    return (
      await web.roleDefinitions
        .select('Name', 'Id')
        .get()
    ).reduce((rds: { [key: string]: string }, { Name, Id }) => ({
      ...rds,
      [Name]: Id
    }), {})
  }
}
