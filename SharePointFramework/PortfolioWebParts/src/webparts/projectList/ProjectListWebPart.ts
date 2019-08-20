import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { IProjectListProps, ProjectList } from 'components';
import MSGraph from 'msgraph-helper';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class ProjectListWebPart extends BasePortfolioWebPart<IProjectListProps> {
  public render(): void {    
    this.renderComponent(ProjectList);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    await MSGraph.Init(this.context.msGraphClientFactory);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('sortBy', {
                  label: strings.SortByFieldLabel,
                }),
                PropertyPaneTextField('phaseTermSetId', {
                  label: strings.PhaseTermSetIdFieldLabel,
                }),
              ]
            },
            {
              groupName: strings.TileViewGroupName,
              groupFields: [
                PropertyPaneToggle('showProjectLogo', {
                  label: strings.ShowProjectLogoFieldLabel,
                }),
                PropertyPaneToggle('showProjectOwner', {
                  label: strings.ShowProjectOwnerFieldLabel,
                }),
                PropertyPaneToggle('showProjectManager', {
                  label: strings.ShowProjectManagerFieldLabel,
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
