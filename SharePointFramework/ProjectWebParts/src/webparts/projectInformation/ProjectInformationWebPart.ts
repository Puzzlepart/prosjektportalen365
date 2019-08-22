import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneToggle, PropertyPaneTextField, PropertyPaneDropdown } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import * as strings from 'ProjectWebPartsStrings';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;

export default class ProjectInformationWebPart extends BaseClientSideWebPart<IProjectInformationProps> {
  private hubSite: IHubSite;

  public async onInit() {
    sp.setup({ spfxContext: this.context });
    this.hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
  }

  public render(): void {
    const element: React.ReactElement<IProjectInformationProps> = React.createElement(
      ProjectInformation,
      {
        ...this.properties,
        title: this.title,
        hubSiteUrl: this.hubSite.url,
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl,
        isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
        filterField: 'GtShowFieldFrontpage'
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.LookAndFeelGroupName,
              groupFields: [
                PropertyPaneToggle('boxLayout', {
                  label: strings.BoxLayoutLabel,
                }),
                PropertyPaneDropdown('boxType', {
                  label: strings.BoxTypeLabel,
                  options: [
                    { key: '1', text: 'Boks 1' },
                    { key: '2', text: 'Boks 2' },
                    { key: '3', text: 'Boks 3' },
                    { key: '4', text: 'Boks 4' },
                    { key: '5', text: 'Boks 5' },
                  ],
                  disabled: !this.properties.boxLayout,
                }),
                PropertyPaneTextField('boxBackgroundColor', {
                  label: strings.BoxBackgroundColorLabel,
                  disabled: !this.properties.boxLayout,
                }),
              ]
            },
          ]
        }
      ]
    };
  }
}
