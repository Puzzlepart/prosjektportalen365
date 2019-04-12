import * as React from 'react';
import * as strings from 'ProjectListWebPartStrings';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import ProjectList from './components/ProjectList';
import { IProjectListProps } from './components/IProjectListProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { Logger, LogLevel } from '@pnp/logging';
import MSGraph from 'msgraph-helper';
import { IProjectListWebPartProps } from './IProjectListWebPartProps';

export default class ProjectListWebPart extends PortfolioBaseWebPart<IProjectListWebPartProps> {
  public render(): void {
    Logger.log({ message: '(ProjectListWebPart) render: Rendering <ProjectList />', level: LogLevel.Info });
    const element: React.ReactElement<IProjectListProps> = React.createElement(ProjectList, { ...this.properties, siteAbsoluteUrl: this.context.pageContext.site.absoluteUrl });
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    await MSGraph.Init(this.context.msGraphClientFactory);
  }

  protected onDispose(): void {
    super.onDispose();
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
                  disabled: true,
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
