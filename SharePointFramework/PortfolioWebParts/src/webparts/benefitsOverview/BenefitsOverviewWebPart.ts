import * as React from 'react';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { Version } from '@microsoft/sp-core-library';
import BenefitsOverview, { IBenefitsOverviewProps } from './components/BenefitsOverview';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IBenefitsOverviewWebPartProps } from './IBenefitsOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class BenefitsOverviewWebPart extends PortfolioBaseWebPart<IBenefitsOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(BenefitsOverviewWebPart) render: Rendering <BenefitsOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IBenefitsOverviewProps> = React.createElement(BenefitsOverview, {
      ...this.properties,
      groupByColumns: [
        { name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'siteTitle', fieldName: 'siteTitle', minWidth: 0 },
        ...BenefitsOverview.defaultProps.groupByColumns,
      ],
    });
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(BenefitsOverviewWebPart) onInit: Initializing BenefitsOverviewWebPart', level: LogLevel.Info });
    await super.onInit();
  }

  protected onDispose(): void {
    Logger.log({ message: '(BenefitsOverviewWebPart) onDispose: Disposing <BenefitsOverview />', level: LogLevel.Info });
    super.onDispose();
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }
}
