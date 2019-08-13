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

moment.locale('nb');
Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;

export default class ProjectStatusWebPart extends BaseClientSideWebPart<IProjectStatusWebPartProps> {
  private _hubSite: IHubSite;
  private _spEntityPortalService: SpEntityPortalService;

  public async onInit() {
    sp.setup({
      spfxContext: this.context,
      defaultCachingTimeoutSeconds: 60,
      globalCacheDisable: false
    });
    this._hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    this._spEntityPortalService = new SpEntityPortalService({ webUrl: this._hubSite.url, ...this.properties.entity });
  }

  public render(): void {
    const element: React.ReactElement<IProjectStatusProps> = React.createElement(ProjectStatus, {
      hubSite: this._hubSite,
      spEntityPortalService: this._spEntityPortalService,
      pageContext: this.context.pageContext,
      ...this.properties,
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
