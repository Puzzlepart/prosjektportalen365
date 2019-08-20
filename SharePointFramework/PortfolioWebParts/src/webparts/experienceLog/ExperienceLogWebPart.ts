import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { ExperienceLog, IExperienceLogProps } from 'components';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class ExperienceLogWebPart extends BasePortfolioWebPart<IExperienceLogProps> {
  public render(): void {
    const groupByColumns = [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }];
    this.renderComponent(ExperienceLog, { groupByColumns, });
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
