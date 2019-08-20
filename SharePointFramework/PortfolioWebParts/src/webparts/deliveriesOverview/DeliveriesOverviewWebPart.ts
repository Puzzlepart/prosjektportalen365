import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { DeliveriesOverview, IDeliveriesOverviewProps } from 'components';
import { BasePortfolioWebPart } from '../@basePortfolioWebPart';


export default class DeliveriesOverviewWebPart extends BasePortfolioWebPart<IDeliveriesOverviewProps> {
  public render(): void {
    this.renderComponent(DeliveriesOverview);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }
  
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
