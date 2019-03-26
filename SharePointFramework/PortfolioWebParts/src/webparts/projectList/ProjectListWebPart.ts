import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, } from '@microsoft/sp-webpart-base';
import ProjectList from './components/ProjectList';
import { IProjectListProps } from './components/IProjectListProps';
import { Web } from '@pnp/sp';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { Logger, LogLevel } from '@pnp/logging';
import MSGraph from 'msgraph-helper';
import { IProjectListWebPartProps } from './IProjectListWebPartProps';

export default class ProjectListWebPart extends PortfolioBaseWebPart<IProjectListWebPartProps> {
  private web: Web;

  public render(): void {
    Logger.log({ message: '(ProjectListWebPart) render: Rendering <ProjectList />', level: LogLevel.Info });
    const element: React.ReactElement<IProjectListProps> = React.createElement(
      ProjectList,
      {
        ...this.properties,
        web: this.web,
        siteId: this.context.pageContext.site.id.toString(),
        siteAbsoluteUrl: this.context.pageContext.site.absoluteUrl,
      }
    );
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    await MSGraph.Init(this.context.msGraphClientFactory);
    this.web = new Web(this.context.pageContext.web.absoluteUrl);
  }

  protected onDispose(): void {
    super.onDispose();
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
