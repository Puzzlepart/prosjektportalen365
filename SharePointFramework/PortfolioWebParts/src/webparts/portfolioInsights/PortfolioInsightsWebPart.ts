import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { IPortfolioInsightsProps, PortfolioInsights } from 'components';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class PortfolioInsightsWebPart extends BasePortfolioWebPart<IPortfolioInsightsProps> {
  public render(): void {
    this.renderComponent(PortfolioInsights);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }
  
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
