import * as React from 'react';
import * as sharedStrings from 'PortfolioWebPartsStrings';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import DeliveriesOverview from './components/DeliveriesOverview';
import { IDeliveriesOverviewProps } from './components/IDeliveriesOverviewProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IDeliveriesOverviewWebPartProps } from './IDeliveriesOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class DeliveriesOverviewWebPart extends PortfolioBaseWebPart<IDeliveriesOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(DeliveriesOverviewWebPart) render: Rendering <DeliveriesOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IDeliveriesOverviewProps> = React.createElement(
      DeliveriesOverview, {
        context: this.context,
        ...this.properties,
        groupByColumns: [{ name: sharedStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
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

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
