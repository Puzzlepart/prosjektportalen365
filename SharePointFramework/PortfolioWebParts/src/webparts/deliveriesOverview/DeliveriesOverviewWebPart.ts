import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import DeliveriesOverview from './components/DeliveriesOverview';
import { IDeliveriesOverviewProps } from './components/IDeliveriesOverviewProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IDeliveriesOverviewWebPartProps } from './IDeliveriesOverviewWebPartProps';

export default class DeliveriesOverviewWebPart extends PortfolioBaseWebPart<IDeliveriesOverviewWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IDeliveriesOverviewProps> = React.createElement(
      DeliveriesOverview, { context: this.context, ...this.properties }
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
