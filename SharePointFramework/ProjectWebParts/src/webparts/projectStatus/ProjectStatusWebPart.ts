import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import SpEntityPortalService from 'sp-entityportal-service';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import { injectStyles } from 'shared/lib/util';

moment.locale('nb');
Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;

export default class ProjectStatusWebPart extends BaseClientSideWebPart<IProjectStatusProps> {
  private _hubSite: IHubSite;
  private _spEntityPortalService: SpEntityPortalService;

  public async onInit() {
    sp.setup({ spfxContext: this.context });
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
}
