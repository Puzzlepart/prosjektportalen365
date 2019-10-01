import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ApplicationInsightsLogListener } from 'shared/lib/logging/ApplicationInsightsLogListener';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import SPDataAdapter from '../../data';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Warning;

export default class ProjectInformationWebPart extends BaseClientSideWebPart<IProjectInformationProps> {
  private _hubSite: IHubSite;

  public async onInit() {
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    sp.setup({ spfxContext: this.context });
    this._hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: this._hubSite.url,
    });
  }

  public render(): void {
    const element: React.ReactElement<IProjectInformationProps> = React.createElement(
      ProjectInformation,
      {
        title: this.properties.title || this.title,
        hubSite: this._hubSite,
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl,
        webTitle: this.context.pageContext.web.title,
        isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
        filterField: 'GtShowFieldFrontpage',
        displayMode: this.displayMode,
        onFieldExternalChanged: this._onFieldExternalChanged.bind(this),
        ...this.properties,
      } as IProjectInformationProps
    );

    ReactDom.render(element, this.domElement);
  }

  private _onFieldExternalChanged(fieldName: string, checked: boolean) {
    let showFieldExternal = { ... this.properties.showFieldExternal || {}, [fieldName]: checked };
    this.properties.showFieldExternal = showFieldExternal;
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ProjectStatusGroupName,
              groupFields: [
                PropertyPaneSlider('statusReportsCount', {
                  label: strings.StatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                }),
                PropertyPaneTextField('statusReportsHeader', {
                  label: strings.StatusReportsHeaderLabel,
                }),
              ],
            },
          ]
        },
      ]
    };
  }
}
