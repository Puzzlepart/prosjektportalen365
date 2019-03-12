import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, } from '@microsoft/sp-webpart-base';
import ProjectList from './components/ProjectList';
import { IProjectListProps } from './components/IProjectListProps';
import { Web } from '@pnp/sp';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';


export interface IProjectListWebPartProps {
  phaseTermSetId: string;
  entity: {
    listName: string;
    contentTypeId: string;
    fieldsGroupName: string;
    siteIdFieldName: string;
  };
}

export default class ProjectListWebPart extends PortfolioBaseWebPart<IProjectListWebPartProps> {
  private web: Web;

  public render(): void {
    const element: React.ReactElement<IProjectListProps> = React.createElement(
      ProjectList,
      {
        ...this.properties,
        pageContext: this.context.pageContext,
        spHttpClient: this.context.spHttpClient,
        web: this.web,
        webServerRelativeUrl: this.context.pageContext.web.serverRelativeUrl,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl
      }
    );
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
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
