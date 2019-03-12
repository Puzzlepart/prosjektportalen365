import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import LatestProjects from './components/LatestProjects';
import { ILatestProjectsProps } from './components/ILatestProjectsProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';

export interface ILatestProjectsWebPartProps {
  title: string;
}

export default class LatestProjectsWebPart extends PortfolioBaseWebPart<ILatestProjectsWebPartProps> {
  public render(): void {
    const element: React.ReactElement<ILatestProjectsProps> = React.createElement(
      LatestProjects,
      {
        context: this.context,
        absoluteUrl: this.context.pageContext.web.absoluteUrl,
        serverRelativeUrl: this.context.pageContext.web.serverRelativeUrl,
        displayMode: this.displayMode,
        updateProperty: (value: string) => {
          this.properties.title = value;
        },
        ...this.properties,
      }
    );
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected onDispose(): void {
    super.onDispose();
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }
}
