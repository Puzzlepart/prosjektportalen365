import { IProjectSetupData } from 'extensions/projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'

export class SitePermissions extends BaseTask {
  public taskName = 'SitePermissions'
  private _groupName = 'Porteføljeadministratorer'

  constructor(data: IProjectSetupData) {
    super(data)
  }

  /**
   * Execute SitePermissions
   *
   * @param {IBaseTaskParams} params Task parameters
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    try {
      if (this.settings.includePortfolioAdministrators) {
        try {
          const users = await this.data.hub.web.siteGroups
            .getByName(this._groupName)
            .users.select('Email', 'LoginName')
            .get()
          for (let i = 0; i < users.length; i++) {
            const { data } = await params.web.ensureUser(users[i].LoginName)
            await params.web.associatedMemberGroup.users.add(data.LoginName)
          }
        } catch (error) {
          this.logInformation(
            `Failed to set site permissions. The group ${this._groupName} might not exist.`
          )
        }
      }
      return params
    } catch (error) {
      this.logError('Failed to set site permissions')
      throw new BaseTaskError(this.taskName, strings.SitePermissionsErrorMessage, '')
    }
  }
}
