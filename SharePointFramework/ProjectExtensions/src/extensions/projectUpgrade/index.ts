import { override } from '@microsoft/decorators'
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base'

/** Empty settings contract retained for the project-upgrade extension. */
export interface IProjectUpgradeProperties {}

/** Inactive project-upgrade customizer retained as an SPFx entry point. */
export default class ProjectUpgrade extends BaseApplicationCustomizer<IProjectUpgradeProperties> {
  @override
  public onInit(): Promise<void> {
    return Promise.resolve()
  }
}
