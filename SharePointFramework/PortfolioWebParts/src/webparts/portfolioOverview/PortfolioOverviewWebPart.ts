import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';


export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  public render(): void {
    this.renderComponent(PortfolioOverview);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }
  
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
