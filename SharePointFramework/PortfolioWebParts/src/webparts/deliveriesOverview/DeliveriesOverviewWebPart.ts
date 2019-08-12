import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import DeliveriesOverview from './components/DeliveriesOverview';
import { IDeliveriesOverviewProps } from './components/IDeliveriesOverviewProps';
import { setupWebPart } from '../@setup';
import { IDeliveriesOverviewWebPartProps } from './IDeliveriesOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class DeliveriesOverviewWebPart extends BaseClientSideWebPart<IDeliveriesOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(DeliveriesOverviewWebPart) render: Rendering <DeliveriesOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IDeliveriesOverviewProps> = React.createElement(
      DeliveriesOverview, {
        ...this.properties,
        pageContext: this.context.pageContext,
        groupByColumns: [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(DeliveriesOverviewWebPart) onInit: Initializing DeliveriesOverviewWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
