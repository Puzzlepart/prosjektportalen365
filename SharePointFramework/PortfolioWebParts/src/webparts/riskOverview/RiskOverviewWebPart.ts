import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import RiskOverview from './components/RiskOverview';
import { IRiskOverviewProps } from './components/IRiskOverviewProps';
import { setupWebPart } from '../@setup';
import { IRiskOverviewWebPartProps } from './IRiskOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class RiskOverviewWebPart extends BaseClientSideWebPart<IRiskOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(RiskOverviewWebPart) render: Rendering <RiskOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IRiskOverviewProps> = React.createElement(RiskOverview, {
      ...this.properties,
      groupByColumns: [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(RiskOverviewWebPart) onInit: Initializing RiskOverviewWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
