import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';
import { sp } from '@pnp/sp';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import SpEntityPortalService from 'sp-entityportal-service';

export interface IBaseWebPartProps {
  title: string;
  entity: {
    listName: string;
    contentTypeId: string;
    fieldsGroupName: string;
    siteIdFieldName: string;
  };
}

export default class BaseWebPart<P extends IBaseWebPartProps> extends BaseClientSideWebPart<P> {
  public isInitialized: boolean;
  public hubSite: IHubSite;
  public spEntityPortalService: SpEntityPortalService;

  constructor() {
    super();
    Logger.activeLogLevel = LogLevel.Info;
    Logger.subscribe(new ConsoleListener());
  }

  public async onInit() {
    const { pageContext } = this.context;
    const { hubSiteId } = pageContext.legacyPageContext;
    this.hubSite = await HubSiteService.GetHubSiteById(pageContext.web.absoluteUrl, hubSiteId);
    this.spEntityPortalService = new SpEntityPortalService({ webUrl: this.hubSite.url, ...this.properties.entity });
    sp.setup({ spfxContext: this.context });
  }

  public render(): void { }

  public _render(component, properties = {}) {
    if (this.isInitialized) {
      const element: React.ReactElement<any> = React.createElement(component, {
        ...(this.properties as any),
        context: this.context,
        hubSite: this.hubSite,
        spEntityPortalService: this.spEntityPortalService,
        ...properties,
      });
      ReactDom.render(element, this.domElement);
    }
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }
}
