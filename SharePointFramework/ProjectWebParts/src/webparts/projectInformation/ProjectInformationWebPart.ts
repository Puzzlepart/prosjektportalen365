import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';

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
        hubSiteUrl: this.hubSite.url,
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl,
        isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
        filterField: 'GtShowFieldFrontpage'
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
