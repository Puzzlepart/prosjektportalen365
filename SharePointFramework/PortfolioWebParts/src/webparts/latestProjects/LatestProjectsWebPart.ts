import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { ILatestProjectsProps, LatestProjects } from 'components';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class LatestProjectsWebPart extends BasePortfolioWebPart<ILatestProjectsProps> {
  public render(): void {    
    this.renderComponent(LatestProjects);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }
  
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
