import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { IResourceAllocationProps, ResourceAllocation } from 'components';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class ResourceAllocationWebPart extends BasePortfolioWebPart<IResourceAllocationProps> {
  public render(): void {
    this.renderComponent(ResourceAllocation);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
