import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { IResourceAllocationProps, ResourceAllocation } from 'components';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class ResourceAllocationWebPart extends BasePortfolioWebPart<IResourceAllocationProps> {
  public render(): void {
    this.renderComponent(ResourceAllocation);
  }

  public async onInit(): Promise<void> {
    await super.onInit();
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
