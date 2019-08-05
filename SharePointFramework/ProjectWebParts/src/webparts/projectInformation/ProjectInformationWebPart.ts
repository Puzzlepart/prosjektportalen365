import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import ProjectInformation from './components/ProjectInformation';
import { IProjectInformationWebPartProps } from './IProjectInformationWebPartProps';
import { IProjectInformationProps } from './components/IProjectInformationProps';
import { sp } from '@pnp/sp';
import HubSiteService from 'sp-hubsite-service';

export default class ProjectInformationWebPart extends BaseClientSideWebPart<IProjectInformationWebPartProps> {
  private _hubSiteUrl: string;

  public async onInit() {
    sp.setup({ spfxContext: this.context });
    const hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    this._hubSiteUrl = hubSite.url;
  }

  public render(): void {
    const element: React.ReactElement<IProjectInformationProps> = React.createElement(
      ProjectInformation,
      {
        ...this.properties,
        hubSiteUrl: this._hubSiteUrl,
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
