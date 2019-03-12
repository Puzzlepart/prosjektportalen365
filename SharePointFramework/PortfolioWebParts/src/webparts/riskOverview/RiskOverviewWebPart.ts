import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import RiskOverview from './components/RiskOverview';
import { IRiskOverviewProps } from './components/IRiskOverviewProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IRiskOverviewWebPartProps } from './IRiskOverviewWebPartProps';

export default class RiskOverviewWebPart extends PortfolioBaseWebPart<IRiskOverviewWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IRiskOverviewProps> = React.createElement(RiskOverview, { ...this.properties });
    super._render(this.manifest.alias, element);
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
