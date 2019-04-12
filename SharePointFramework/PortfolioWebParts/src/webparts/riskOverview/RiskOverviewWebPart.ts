import * as React from 'react';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import RiskOverview from './components/RiskOverview';
import { IRiskOverviewProps } from './components/IRiskOverviewProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IRiskOverviewWebPartProps } from './IRiskOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class RiskOverviewWebPart extends PortfolioBaseWebPart<IRiskOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(RiskOverviewWebPart) render: Rendering <RiskOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IRiskOverviewProps> = React.createElement(RiskOverview, {
      ...this.properties,
      groupByColumns: [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    });
    super._render(this.manifest.alias, element);
  }

  protected onDispose(): void {
    super.onDispose();
  }
}
