import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { IResourceAllocationProps, ResourceAllocation } from 'components/ResourceAllocation'
import { BasePortfolioWebPart } from '../@basePortfolioWebPart'

export default class ResourceAllocationWebPart extends BasePortfolioWebPart<IResourceAllocationProps> {
  public render(): void {
    this.renderComponent<IResourceAllocationProps>(ResourceAllocation)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration()
  }
}
