import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import PortfolioOverview from './components/PortfolioOverview';
import { IPortfolioOverviewProps } from './components/IPortfolioOverviewProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IPortfolioOverviewWebPartProps } from './IPortfolioOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class PortfolioOverviewWebPart extends PortfolioBaseWebPart<IPortfolioOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(PortfolioOverviewWebPart) render: Rendering <PortfolioOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IPortfolioOverviewProps> = React.createElement(PortfolioOverview, { ...this.properties, title: 'Porteføljeoversikt', context: this.context });
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
