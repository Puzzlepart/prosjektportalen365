import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'PortfolioWebPartsStrings';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { ProjectList, IProjectListProps } from 'components';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';
import { sp } from '@pnp/sp';
import MSGraph from 'msgraph-helper';

export default class ProjectListWebPart extends BaseClientSideWebPart<IProjectListProps> {
  public render(): void {
    Logger.log({ message: '(ProjectListWebPart) render: Rendering <ProjectList />', level: LogLevel.Info });
    const element: React.ReactElement<IProjectListProps> = React.createElement(ProjectList, {
      ...this.properties,
      siteAbsoluteUrl: this.context.pageContext.site.absoluteUrl,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await MSGraph.Init(this.context.msGraphClientFactory);
    sp.setup({ spfxContext: this.context });
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
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
