import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { LatestProjects, ILatestProjectsProps } from 'components/LatestProjects';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class LatestProjectsWebPart extends BasePortfolioWebPart<ILatestProjectsProps> {
  public render(): void {    
    this.renderComponent(LatestProjects);
  }

  public async onInit(): Promise<void> {
    await super.onInit();
  }
  
  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration();
  }
}
