import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import ProjectInformation from './components/ProjectInformation';
import { IProjectInformationWebPartProps } from './IProjectInformationWebPartProps';
import { IProjectInformationProps } from './components/IProjectInformationProps';
import HubSiteService from 'sp-hubsite-service';
import { sp } from '@pnp/sp';

export default class ProjectInformationWebPart extends BaseClientSideWebPart<IProjectInformationWebPartProps> {
  public async onInit() {
    sp.setup({ spfxContext: this.context });
  }

  public async render(): Promise<void> {
    const hubSite = await HubSiteService.GetHubSiteById(this.context.pageContext.web.absoluteUrl, this.context.pageContext.legacyPageContext.hubSiteId);
    const element: React.ReactElement<IProjectInformationProps> = React.createElement(
      ProjectInformation,
      {
        ...this.properties,
        updateTitle: (title: string) => this.properties.title = title,
        hubSite,
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

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
