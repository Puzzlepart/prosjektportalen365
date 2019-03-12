import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import PortfolioInsights from './components/PortfolioInsights';
import { IPortfolioInsightsProps } from './components/IPortfolioInsightsProps';
import { IPortfolioInsightsWebPartProps } from './IPortfolioInsightsWebPartProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';


export default class PortfolioInsightsWebPart extends PortfolioBaseWebPart<IPortfolioInsightsWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IPortfolioInsightsProps> = React.createElement(PortfolioInsights, { context: this.context, ...this.properties });
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

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
