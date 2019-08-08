import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
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
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
    this.hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
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
