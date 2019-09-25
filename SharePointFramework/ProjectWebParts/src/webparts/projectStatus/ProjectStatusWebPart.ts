import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus';
import * as moment from 'moment';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ApplicationInsightsLogListener } from 'shared/lib/logging/ApplicationInsightsLogListener';
import { SpEntityPortalService } from 'sp-entityportal-service';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';

moment.locale('nb');
Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;

export default class ProjectStatusWebPart extends BaseClientSideWebPart<IProjectStatusProps> {
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
  }

  public render(): void {
    const element: React.ReactElement<IProjectStatusProps> = React.createElement(ProjectStatus, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      webTitle: this.context.pageContext.web.title,
      currentUserEmail: this.context.pageContext.user.email,
      hubSiteUrl: this._hubSite.url,
      ...this.properties,
    });
    ReactDom.render(element, this.domElement);
  }
}
