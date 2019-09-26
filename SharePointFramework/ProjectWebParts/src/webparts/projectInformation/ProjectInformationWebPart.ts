import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ApplicationInsightsLogListener } from 'shared/lib/logging/ApplicationInsightsLogListener';
import { SpEntityPortalService } from 'sp-entityportal-service';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import SPDataAdapter from '../../data';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Warning;

export default class ProjectInformationWebPart extends BaseClientSideWebPart<IProjectInformationProps> {
  private _hubSite: IHubSite;
  private _spEntityPortalService: SpEntityPortalService;

  public async onInit() {
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    sp.setup({ spfxContext: this.context });
    this._hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    this._spEntityPortalService = new SpEntityPortalService({
      portalUrl: this._hubSite.url,
      fieldPrefix: 'Gt',
      ...this.properties.entity,
    });
    SPDataAdapter.configure(this.context, {
      spEntityPortalService: this._spEntityPortalService,
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
        hubSiteUrl: this._hubSite.url,
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl,
        isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
        filterField: 'GtShowFieldFrontpage',
        ...this.properties,
      }
    );

    ReactDom.render(element, this.domElement);
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
                PropertyPaneTextField('statusReportsListName', {
                  label: strings.StatusReportsListNameLabel,
                  disabled: true,
                }),
                PropertyPaneTextField('statusReportsLinkUrlTemplate', {
                  label: strings.StatusReportsLinkUrlTemplateLabel,
                }),
              ],
            },
          ]
        }
      ]
    };
  }
}
