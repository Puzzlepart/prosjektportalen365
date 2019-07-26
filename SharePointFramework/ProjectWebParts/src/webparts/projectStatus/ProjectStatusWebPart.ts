import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import "@pnp/polyfill-ie11";
import { sp } from '@pnp/sp';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import SpEntityPortalService from 'sp-entityportal-service';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import ProjectStatus, { IProjectStatusProps } from "./components/ProjectStatus";
import { IProjectStatusWebPartProps } from './IProjectStatusWebPartProps';


export default class ProjectStatusWebPart extends BaseClientSideWebPart<IProjectStatusWebPartProps> {
  private hubSite: IHubSite;
  private spEntityPortalService: SpEntityPortalService;

  public async onInit() {
    sp.setup({ spfxContext: this.context });
    moment.locale('nb');
    this.hubSite = await HubSiteService.GetHubSiteById(this.context.pageContext.web.absoluteUrl, this.context.pageContext.legacyPageContext.hubSiteId);
    const params = { webUrl: this.hubSite.url, ...this.properties.entity };
    this.spEntityPortalService = new SpEntityPortalService(params);
  }

  public render(): void {
    const element: React.ReactElement<IProjectStatusProps> = React.createElement(ProjectStatus, {
      hubSite: this.hubSite,
      spEntityPortalService: this.spEntityPortalService,
      pageContext: this.context.pageContext,
      ...this.properties,
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
