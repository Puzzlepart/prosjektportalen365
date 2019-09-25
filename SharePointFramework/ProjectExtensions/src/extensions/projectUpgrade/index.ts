import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';

export interface IProjectUpgradeApplicationCustomizerProperties { }

export default class ProjectUpgradeApplicationCustomizer extends BaseApplicationCustomizer<IProjectUpgradeApplicationCustomizerProperties> {
  @override
  public onInit(): Promise<void> {
    return Promise.resolve();
  }
}
