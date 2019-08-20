import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { BenefitsOverview, IBenefitsOverviewProps } from 'components';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class BenefitsOverviewWebPart extends BasePortfolioWebPart<IBenefitsOverviewProps> {
  public render(): void {
    this.renderComponent(BenefitsOverview);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
